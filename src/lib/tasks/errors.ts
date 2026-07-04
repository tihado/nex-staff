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
