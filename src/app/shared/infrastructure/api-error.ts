import { HttpErrorResponse } from '@angular/common/http';

/** Preserves the HTTP status and business details while remaining compatible with Error consumers. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly details?: string) { super(message); }
}

/**
 * Reads the HTTP status of a failed request, so a store can tell its views which failure happened.
 *
 * @param error - Error emitted by an API endpoint
 * @returns The HTTP status (0 when the server could not be reached), or null if the error did not come from a request
 */
export function errorStatus(error: unknown): number | null {
  return error instanceof ApiError || error instanceof HttpErrorResponse ? error.status : null;
}
