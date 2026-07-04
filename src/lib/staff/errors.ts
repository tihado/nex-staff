export class StaffLimitError extends Error {
  readonly code = "staff_limit" as const;

  constructor(limit: number) {
    super(`You can hire at most ${limit} staff members.`);
    this.name = "StaffLimitError";
  }
}

export class StaffValidationError extends Error {
  readonly code = "validation_error" as const;

  constructor(message: string) {
    super(message);
    this.name = "StaffValidationError";
  }
}
