"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTaskEventSource } from "@/hooks/use-task-event-source";
import type {
  TaskCompletedSsePayload,
  TaskProgressSsePayload,
  TaskSummary,
} from "@/lib/tasks/types";

export type DeskState = "done" | "idle" | "working";

export interface WorkspaceDeskState {
  currentStep: string | null;
  staffId: string;
  state: DeskState;
  taskId: string | null;
}

export interface TaskCompletionBanner {
  staffId: string;
  taskId: string;
  title: string;
}

interface TasksResponse {
  tasks: TaskSummary[];
}

async function fetchActiveTasks(): Promise<TaskSummary[]> {
  const response = await fetch("/api/tasks?status=pending,running");

  if (!response.ok) {
    throw new Error("Failed to load tasks.");
  }

  const data = (await response.json()) as TasksResponse;
  return data.tasks;
}

function upsertTask(
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

function buildDeskStates(
  tasks: TaskSummary[],
  completedDesks: Map<string, TaskCompletionBanner>
): WorkspaceDeskState[] {
  const byStaff = new Map<string, WorkspaceDeskState>();

  for (const task of tasks) {
    byStaff.set(task.staffId, {
      staffId: task.staffId,
      state: "working",
      taskId: task.id,
      currentStep: task.currentStep,
    });
  }

  for (const [staffId, banner] of completedDesks) {
    byStaff.set(staffId, {
      staffId,
      state: "done",
      taskId: banner.taskId,
      currentStep: null,
    });
  }

  return [...byStaff.values()];
}

export function useWorkspaceTasks(enabled = true) {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedDesks, setCompletedDesks] = useState<
    Map<string, TaskCompletionBanner>
  >(() => new Map());
  const [banner, setBanner] = useState<TaskCompletionBanner | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const nextTasks = await fetchActiveTasks();
      setTasks(nextTasks);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load tasks."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    reload().catch(() => {
      setLoading(false);
    });
  }, [enabled, reload]);

  const handleProgress = useCallback(
    (payload: TaskProgressSsePayload) => {
      setTasks((current) => {
        if (!current.some((task) => task.id === payload.taskId)) {
          reload().catch(() => {
            /* ignore refresh errors */
          });
          return current;
        }

        return upsertTask(current, payload);
      });
    },
    [reload]
  );

  const handleCompleted = useCallback((payload: TaskCompletedSsePayload) => {
    setTasks((current) => current.filter((task) => task.id !== payload.taskId));

    const completion: TaskCompletionBanner = {
      taskId: payload.taskId,
      staffId: payload.staffId,
      title: payload.title,
    };

    setCompletedDesks((current) => {
      const next = new Map(current);
      next.set(payload.staffId, completion);
      return next;
    });
    setBanner(completion);
  }, []);

  useTaskEventSource(
    {
      onProgress: handleProgress,
      onCompleted: handleCompleted,
    },
    enabled
  );

  const deskStates = useMemo(
    () => buildDeskStates(tasks, completedDesks),
    [tasks, completedDesks]
  );

  const dismissBanner = useCallback(() => {
    setBanner(null);
  }, []);

  const dismissDeskDone = useCallback((staffId: string) => {
    setCompletedDesks((current) => {
      const next = new Map(current);
      next.delete(staffId);
      return next;
    });
  }, []);

  const acknowledgeCompletedDesks = useCallback(() => {
    setCompletedDesks(new Map());
  }, []);

  return {
    banner,
    deskStates,
    acknowledgeCompletedDesks,
    dismissBanner,
    dismissDeskDone,
    error,
    loading,
    reload,
    tasks,
  };
}
