"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type AgentEmote,
  type DeskState,
  WORKSPACE_DESK_SLOTS,
  type WorkspaceDesk,
} from "@/components/workplace/workspace-layout";
import { useTaskEventSource } from "@/hooks/use-task-event-source";
import type { StaffSummary } from "@/lib/staff/types";
import type {
  TaskCompletedSsePayload,
  TaskProgressSsePayload,
  TaskSummary,
} from "@/lib/tasks/types";

const IDEA_PROGRESS_THRESHOLD = 60;
const DONE_RECENCY_MS = 10 * 60 * 1000;

interface DerivedAgent {
  emote: AgentEmote;
  location: "desk" | "pantry";
  progress: number;
  state: DeskState;
}

export interface TaskCompletionBanner {
  staffId: string;
  taskId: string;
  title: string;
}

function isRecentlyCompleted(task: TaskSummary): boolean {
  if (task.status !== "completed") {
    return false;
  }

  if (!task.completedAt) {
    return true;
  }

  return Date.now() - new Date(task.completedAt).getTime() < DONE_RECENCY_MS;
}

function deriveAgent(
  staffMember: StaffSummary,
  tasks: TaskSummary[]
): DerivedAgent {
  const activeTask = tasks.find(
    (task) => task.status === "running" || task.status === "pending"
  );

  if (activeTask) {
    return {
      state: "working",
      location: "desk",
      progress: activeTask.progressPercent,
      emote:
        activeTask.progressPercent >= IDEA_PROGRESS_THRESHOLD
          ? "idea"
          : "thinking",
    };
  }

  const completedTask = tasks.find(isRecentlyCompleted);

  if (completedTask) {
    return {
      state: "done",
      location: "pantry",
      progress: 100,
      emote: "notify",
    };
  }

  if (staffMember.status === "offline") {
    return { state: "offline", location: "desk", progress: 0, emote: null };
  }

  return { state: "idle", location: "desk", progress: 0, emote: null };
}

function buildDesks(
  staff: StaffSummary[],
  tasks: TaskSummary[]
): WorkspaceDesk[] {
  const tasksByStaff = new Map<string, TaskSummary[]>();
  for (const task of tasks) {
    const existing = tasksByStaff.get(task.staffId) ?? [];
    existing.push(task);
    tasksByStaff.set(task.staffId, existing);
  }

  return WORKSPACE_DESK_SLOTS.map((slot, index) => {
    const staffMember = staff[index];

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
      tasksByStaff.get(staffMember.id) ?? []
    );

    return {
      id: slot.id,
      staffId: staffMember.id,
      gridPosition: slot.gridPosition,
      state: derived.state,
      emote: derived.emote,
      location: derived.location,
      progress: derived.progress,
      label: staffMember.name,
      role: staffMember.role,
      avatarSprite: staffMember.avatarSprite,
    };
  });
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
  banner: TaskCompletionBanner | null;
  desks: WorkspaceDesk[];
  dismissBanner: () => void;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  tasks: TaskSummary[];
}

export function useWorkspaceState(): UseWorkspaceStateResult {
  const [staff, setStaff] = useState<StaffSummary[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<TaskCompletionBanner | null>(null);

  const load = useCallback(async () => {
    try {
      const [staffResult, tasksResult] = await Promise.all([
        fetchJson<{ staff: StaffSummary[] }>("/api/staff"),
        fetchJson<{ tasks: TaskSummary[] }>(
          "/api/tasks?status=running,pending,completed"
        ),
      ]);

      setStaff(staffResult.staff);
      setTasks(tasksResult.tasks);
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

  const handleCompleted = useCallback((payload: TaskCompletedSsePayload) => {
    const completedAt = new Date().toISOString();

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
      title: payload.title,
    });
  }, []);

  useTaskEventSource(
    {
      onProgress: handleProgress,
      onCompleted: handleCompleted,
    },
    true
  );

  const desks = useMemo(() => buildDesks(staff, tasks), [staff, tasks]);

  const dismissBanner = useCallback(() => {
    setBanner(null);
  }, []);

  return {
    banner,
    desks,
    dismissBanner,
    error,
    loading,
    refresh: load,
    tasks,
  };
}
