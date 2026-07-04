"use client";

import { useEffect, useRef } from "react";
import type {
  TaskCompletedSsePayload,
  TaskFailedSsePayload,
  TaskProgressSsePayload,
} from "@/lib/tasks/types";

const INITIAL_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 30_000;

export interface TaskEventSourceHandlers {
  onCompleted?: (payload: TaskCompletedSsePayload) => void;
  onFailed?: (payload: TaskFailedSsePayload) => void;
  onProgress?: (payload: TaskProgressSsePayload) => void;
}

function parseEventData<T>(event: MessageEvent<string>): T | null {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}

export function useTaskEventSource(
  handlers: TaskEventSourceHandlers,
  enabled = true
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let closed = false;
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | undefined;
    let reconnectDelay = INITIAL_RECONNECT_MS;

    const handleProgress = (event: MessageEvent<string>) => {
      const payload = parseEventData<TaskProgressSsePayload>(event);
      if (payload) {
        handlersRef.current.onProgress?.(payload);
      }
    };

    const handleCompleted = (event: MessageEvent<string>) => {
      const payload = parseEventData<TaskCompletedSsePayload>(event);
      if (payload) {
        handlersRef.current.onCompleted?.(payload);
      }
    };

    const handleFailed = (event: MessageEvent<string>) => {
      const payload = parseEventData<TaskFailedSsePayload>(event);
      if (payload) {
        handlersRef.current.onFailed?.(payload);
      }
    };

    const connect = () => {
      if (closed) {
        return;
      }

      eventSource?.close();
      eventSource = new EventSource("/api/events");

      eventSource.addEventListener("task.progress", handleProgress);
      eventSource.addEventListener("task.completed", handleCompleted);
      eventSource.addEventListener("task.failed", handleFailed);

      eventSource.onopen = () => {
        reconnectDelay = INITIAL_RECONNECT_MS;
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;

        if (closed) {
          return;
        }

        reconnectTimeout = setTimeout(() => {
          reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_MS);
          connect();
        }, reconnectDelay);
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      eventSource?.close();
    };
  }, [enabled]);
}
