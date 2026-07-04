"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AgentEmote,
  type DeskState,
  WORKSPACE_DESK_SLOTS,
  type WorkspaceDesk,
} from "@/components/workplace/workspace-layout";
import { useTaskEventSource } from "@/hooks/use-task-event-source";
import { fetchPendingTaskCompletions } from "@/lib/notifications/client";
import type { PendingTaskCompletion } from "@/lib/notifications/service";
import type { DeskAssignments } from "@/lib/staff/desk-assignments";
import {
  pruneDeskAssignments,
  readDeskAssignments,
} from "@/lib/staff/desk-assignments";
import type { StaffSummary } from "@/lib/staff/types";
import type {
  TaskCompletedSsePayload,
  TaskFailedSsePayload,
  TaskProgressSsePayload,
  TaskSummary,
} from "@/lib/tasks/types";

const IDEA_PROGRESS_THRESHOLD = 60;

interface DerivedAgent {
  emote: AgentEmote;
  location: "desk" | "pantry" | "roaming";
  pendingTaskId: string | null;
  progress: number;
  state: DeskState;
}

export interface TaskCompletionBanner {
  staffId: string;
  staffName: string;
  taskId: string;
  title: string;
}

export interface TaskFailureBanner {
  error: string;
  staffId: string;
  staffName: string;
  taskId: string;
  title: string;
}

function deriveAgent(
  staffMember: StaffSummary,
  tasks: TaskSummary[],
  pendingCompletion: PendingTaskCompletion | undefined
): DerivedAgent {
  const activeTask = tasks.find(
    (task) => task.status === "running" || task.status === "pending"
  );

  if (activeTask) {
    return {
      state: "working",
      location: "desk",
      pendingTaskId: null,
      progress: activeTask.progressPercent,
      emote:
        activeTask.progressPercent >= IDEA_PROGRESS_THRESHOLD
          ? "idea"
          : "thinking",
    };
  }

  const failedTask = tasks.find((task) => task.status === "failed");

  if (failedTask) {
    return {
      state: "failed",
      location: "desk",
      pendingTaskId: null,
      progress: failedTask.progressPercent,
      emote: "failed",
    };
  }

  if (pendingCompletion) {
    return {
      state: "done",
      location: "pantry",
      pendingTaskId: pendingCompletion.taskId,
      progress: 100,
      emote: "notify",
    };
  }

  if (staffMember.status === "offline") {
    return {
      state: "offline",
      location: "desk",
      pendingTaskId: null,
      progress: 0,
      emote: null,
    };
  }

  return {
    state: "idle",
    location: "roaming",
    pendingTaskId: null,
    progress: 0,
    emote: null,
  };
}

function buildDesks(
  staffMembers: StaffSummary[],
  tasks: TaskSummary[],
  deskAssignments: DeskAssignments,
  pendingByStaffId: Map<string, PendingTaskCompletion>
): WorkspaceDesk[] {
  const tasksByStaff = new Map<string, TaskSummary[]>();
  for (const task of tasks) {
    const existing = tasksByStaff.get(task.staffId) ?? [];
    existing.push(task);
    tasksByStaff.set(task.staffId, existing);
  }

  const staffBySlot = new Map<string, StaffSummary>();
  const unassigned: StaffSummary[] = [];

  for (const member of staffMembers) {
    const slotId = deskAssignments[member.id];

    if (slotId) {
      staffBySlot.set(slotId, member);
    } else {
      unassigned.push(member);
    }
  }

  let unassignedIndex = 0;

  for (const slot of WORKSPACE_DESK_SLOTS) {
    if (staffBySlot.has(slot.id)) {
      continue;
    }

    if (unassignedIndex < unassigned.length) {
      staffBySlot.set(slot.id, unassigned[unassignedIndex]);
      unassignedIndex += 1;
    }
  }

  return WORKSPACE_DESK_SLOTS.map((slot) => {
    const staffMember = staffBySlot.get(slot.id);

    if (!staffMember) {
      return {
        id: slot.id,
        gridPosition: slot.gridPosition,
        state: "empty" as const,
        emote: null,
        location: "desk" as const,
        progress: 0,
        label: "For hire",
      };
    }

    const derived = deriveAgent(
      staffMember,
      tasksByStaff.get(staffMember.id) ?? [],
      pendingByStaffId.get(staffMember.id)
    );

    return {
      id: slot.id,
      staffId: staffMember.id,
      gridPosition: slot.gridPosition,
      state: derived.state,
      emote: derived.emote,
      location: derived.location,
      progress: derived.progress,
      pendingTaskId: derived.pendingTaskId,
      label: staffMember.name,
      role: staffMember.role,
      avatarSprite: staffMember.avatarSprite,
    };
  });
}

/** Mirrors desk layout fallback so hire flow respects visually occupied slots. */
export function getOccupiedDeskSlotIds(
  staffMembers: StaffSummary[],
  deskAssignments: DeskAssignments
): string[] {
  const occupied = new Set(Object.values(deskAssignments));
  const assignedStaffIds = new Set(Object.keys(deskAssignments));
  const unassigned = staffMembers.filter(
    (member) => !assignedStaffIds.has(member.id)
  );
  let unassignedIndex = 0;

  for (const slot of WORKSPACE_DESK_SLOTS) {
    if (occupied.has(slot.id)) {
      continue;
    }

    if (unassignedIndex < unassigned.length) {
      occupied.add(slot.id);
      unassignedIndex += 1;
    }
  }

  return [...occupied];
}

function upsertTaskProgress(
  tasks: TaskSummary[],
  update: TaskProgressSsePayload
): TaskSummary[] {
  const index = tasks.findIndex((task) => task.id === update.taskId);

  if (index === -1) {
    return tasks;
  }

  const next = [...tasks];
  next[index] = {
    ...next[index],
    progressPercent: update.progressPercent,
    currentStep: update.currentStep,
    status: next[index].status === "pending" ? "running" : next[index].status,
  };

  return next;
}

function pendingToMap(
  pending: PendingTaskCompletion[]
): Map<string, PendingTaskCompletion> {
  const map = new Map<string, PendingTaskCompletion>();

  for (const entry of pending) {
    map.set(entry.staffId, entry);
  }

  return map;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

interface UseWorkspaceStateResult {
  acknowledgeCompletion: (taskId: string) => Promise<void>;
  banner: TaskCompletionBanner | null;
  desks: WorkspaceDesk[];
  dismissBanner: () => void;
  dismissFailureBanner: () => void;
  error: string | null;
  failureBanner: TaskFailureBanner | null;
  getPendingCompletion: (taskId: string) => PendingTaskCompletion | undefined;
  loading: boolean;
  occupiedDeskSlotIds: string[];
  pendingCompletions: PendingTaskCompletion[];
  refresh: () => Promise<void>;
  staff: StaffSummary[];
  tasks: TaskSummary[];
}

export function useWorkspaceState(): UseWorkspaceStateResult {
  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [deskAssignments, setDeskAssignments] = useState<DeskAssignments>({});
  const [pendingCompletions, setPendingCompletions] = useState<
    PendingTaskCompletion[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<TaskCompletionBanner | null>(null);
  const [failureBanner, setFailureBanner] = useState<TaskFailureBanner | null>(
    null
  );

  const refreshPending = useCallback(async () => {
    const pending = await fetchPendingTaskCompletions();
    setPendingCompletions(pending);
  }, []);

  const load = useCallback(async () => {
    try {
      const [staffResult, tasksResult, pending] = await Promise.all([
        fetchJson<{ staff: StaffSummary[] }>("/api/staff"),
        fetchJson<{ tasks: TaskSummary[] }>(
          "/api/tasks?status=running,pending,completed,failed"
        ),
        fetchPendingTaskCompletions(),
      ]);

      pruneDeskAssignments(staffResult.staff.map((member) => member.id));

      setStaff(staffResult.staff);
      setTasks(tasksResult.tasks);
      setPendingCompletions(pending);
      setDeskAssignments(readDeskAssignments());
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load workspace."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleProgress = useCallback(
    (payload: TaskProgressSsePayload) => {
      setTasks((current) => {
        if (!current.some((task) => task.id === payload.taskId)) {
          load().catch(() => {
            /* ignore refresh errors */
          });
          return current;
        }

        return upsertTaskProgress(current, payload);
      });
    },
    [load]
  );

  const handleCompleted = useCallback(
    (payload: TaskCompletedSsePayload) => {
      const completedAt = new Date().toISOString();
      const staffName =
        staff.find((member) => member.id === payload.staffId)?.name ?? "Staff";

      setTasks((current) =>
        current.map((task) =>
          task.id === payload.taskId
            ? {
                ...task,
                status: "completed" as const,
                progressPercent: 100,
                completedAt,
              }
            : task
        )
      );

      setBanner({
        taskId: payload.taskId,
        staffId: payload.staffId,
        staffName,
        title: payload.title,
      });

      refreshPending().catch(() => {
        /* ignore refresh errors */
      });
    },
    [refreshPending, staff]
  );

  const handleFailed = useCallback(
    (payload: TaskFailedSsePayload) => {
      const failedAt = new Date().toISOString();
      const staffName =
        staff.find((member) => member.id === payload.staffId)?.name ?? "Staff";
      const failedTask = tasks.find((task) => task.id === payload.taskId);

      setTasks((current) => {
        if (!current.some((task) => task.id === payload.taskId)) {
          load().catch(() => {
            /* ignore refresh errors */
          });
          return current;
        }

        return current.map((task) =>
          task.id === payload.taskId
            ? {
                ...task,
                status: "failed" as const,
                failureMessage: payload.error,
                completedAt: failedAt,
              }
            : task
        );
      });

      setFailureBanner({
        taskId: payload.taskId,
        staffId: payload.staffId,
        staffName,
        title: failedTask?.brief.slice(0, 120) ?? "Task",
        error: payload.error,
      });
    },
    [load, staff, tasks]
  );

  useTaskEventSource(
    {
      onProgress: handleProgress,
      onCompleted: handleCompleted,
      onFailed: handleFailed,
    },
    true
  );

  const pendingByStaffId = useMemo(
    () => pendingToMap(pendingCompletions),
    [pendingCompletions]
  );

  const desks = useMemo(
    () => buildDesks(staff, tasks, deskAssignments, pendingByStaffId),
    [staff, tasks, deskAssignments, pendingByStaffId]
  );

  const occupiedDeskSlotIds = useMemo(
    () => getOccupiedDeskSlotIds(staff, deskAssignments),
    [staff, deskAssignments]
  );

  const dismissBanner = useCallback(() => {
    setBanner(null);
  }, []);

  const dismissFailureBanner = useCallback(() => {
    setFailureBanner(null);
  }, []);

  const acknowledgeCompletion = useCallback(
    async (taskId: string) => {
      const match = pendingCompletions.find((entry) => entry.taskId === taskId);

      if (!match) {
        return;
      }

      const response = await fetch(
        `/api/notifications/${match.notificationId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "delivered" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to acknowledge notification.");
      }

      setPendingCompletions((current) =>
        current.filter((entry) => entry.taskId !== taskId)
      );
    },
    [pendingCompletions]
  );

  const getPendingCompletion = useCallback(
    (taskId: string) =>
      pendingCompletions.find((entry) => entry.taskId === taskId),
    [pendingCompletions]
  );

  return {
    acknowledgeCompletion,
    banner,
    desks,
    dismissBanner,
    dismissFailureBanner,
    error,
    failureBanner,
    getPendingCompletion,
    loading,
    occupiedDeskSlotIds,
    pendingCompletions,
    refresh: load,
    staff,
    tasks,
  };
}
