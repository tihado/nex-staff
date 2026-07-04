"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  TaskDetail,
  TaskEventRecord,
  TaskPreviewRecord,
} from "@/lib/tasks/types";

interface TaskEventsResponse {
  events: TaskEventRecord[];
  nextCursor: string | null;
}

interface UseTaskDetailResult {
  detail: TaskDetail | null;
  error: string | null;
  events: TaskEventRecord[];
  loading: boolean;
  preview: TaskPreviewRecord | null;
  refresh: () => Promise<void>;
}

export function useTaskDetail(taskId: string | null): UseTaskDetailResult {
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [events, setEvents] = useState<TaskEventRecord[]>([]);
  const [preview, setPreview] = useState<TaskPreviewRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!taskId) {
      setDetail(null);
      setEvents([]);
      setPreview(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [detailResponse, eventsResponse, previewResponse] =
        await Promise.all([
          fetch(`/api/tasks/${taskId}`),
          fetch(`/api/tasks/${taskId}/events?limit=30`),
          fetch(`/api/tasks/${taskId}/preview`),
        ]);

      if (!detailResponse.ok) {
        throw new Error("Failed to load task details.");
      }

      const detailData = (await detailResponse.json()) as TaskDetail;
      setDetail(detailData);

      if (eventsResponse.ok) {
        const eventsData = (await eventsResponse.json()) as TaskEventsResponse;
        setEvents(eventsData.events ?? []);
      } else {
        setEvents([]);
      }

      if (previewResponse.ok) {
        setPreview((await previewResponse.json()) as TaskPreviewRecord);
      } else {
        setPreview(null);
      }
    } catch (loadError) {
      setDetail(null);
      setEvents([]);
      setPreview(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load task details."
      );
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    refresh().catch(() => {
      /* handled in refresh */
    });
  }, [refresh]);

  return {
    detail,
    events,
    preview,
    loading,
    error,
    refresh,
  };
}
