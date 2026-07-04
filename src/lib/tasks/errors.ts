export class TaskNotFoundError extends Error {
  readonly code = "not_found" as const;

  constructor(message = "Task not found.") {
    super(message);
    this.name = "TaskNotFoundError";
  }
}

export class TaskValidationError extends Error {
  readonly code = "validation_error" as const;

  constructor(message: string) {
    super(message);
    this.name = "TaskValidationError";
  }
}

export class TaskDispatchError extends Error {
  readonly code = "dispatch_error" as const;

  constructor(message: string) {
    super(message);
    this.name = "TaskDispatchError";
  }
}

export class TaskCancelError extends Error {
  readonly code = "cancel_error" as const;

  constructor(message: string) {
    super(message);
    this.name = "TaskCancelError";
  }
}

export class TaskCancelledError extends Error {
  readonly code = "cancelled" as const;

  constructor(message = "Task was cancelled.") {
    super(message);
    this.name = "TaskCancelledError";
  }
}

export function isTaskCancelledError(error: unknown): boolean {
  return (
    error instanceof TaskCancelledError ||
    (error instanceof Error && error.name === "TaskCancelledError")
  );
}
