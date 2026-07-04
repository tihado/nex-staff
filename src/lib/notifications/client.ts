interface PendingNotificationsResponse {
  pending: import("@/lib/notifications/service").PendingTaskCompletion[];
}

export async function fetchPendingTaskCompletions(): Promise<
  import("@/lib/notifications/service").PendingTaskCompletion[]
> {
  const response = await fetch("/api/notifications/pending", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Failed to load pending notifications.");
  }

  const data = (await response.json()) as PendingNotificationsResponse;
  return data.pending;
}

export async function acknowledgeTaskCompletion(taskId: string): Promise<void> {
  const pending = await fetchPendingTaskCompletions();
  const match = pending.find((entry) => entry.taskId === taskId);

  if (!match) {
    return;
  }

  const response = await fetch(`/api/notifications/${match.notificationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "delivered" }),
  });

  if (!response.ok) {
    throw new Error("Failed to acknowledge notification.");
  }
}
