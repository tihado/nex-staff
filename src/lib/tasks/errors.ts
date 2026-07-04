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
