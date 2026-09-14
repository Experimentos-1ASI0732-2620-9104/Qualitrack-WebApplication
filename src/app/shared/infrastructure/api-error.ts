/** Preserves the HTTP status and business details while remaining compatible with Error consumers. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly details?: string) { super(message); }
}
