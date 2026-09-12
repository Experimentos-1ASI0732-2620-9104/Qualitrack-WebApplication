import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

/**
 * Abstract base class providing centralized HTTP error handling for QualiTrack.
 * @remarks All API endpoint classes in the bounded contexts extend this class
 * to avoid duplicating error handling logic. Maps HTTP status codes to
 * meaningful error messages aligned with the QualiTrack domain.
 * @author QualiTrack
 */
export abstract class ErrorHandlingEnabledBaseType {
  /**
   * Handles HTTP errors and returns an observable that throws a typed error.
   * @param operation - A human-readable description of the failed operation.
   * @returns A function that takes an HttpErrorResponse and returns an Observable<never>.
   */
  protected handleError(operation: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      let errorMessage = operation;

      if (error.status === 400) {
        errorMessage = `${operation}: Invalid request data`;
      } else if (error.status === 401) {
        errorMessage = `${operation}: Unauthorized. Please sign in again`;
      } else if (error.status === 403) {
        errorMessage = `${operation}: Forbidden. Insufficient permissions`;
      } else if (error.status === 404) {
        errorMessage = `Resource not found: ${operation}`;
      } else if (error.status === 409) {
        errorMessage = `${operation}: Conflict. The resource already exists`;
      } else if (error.status === 422) {
        errorMessage = `${operation}: Unprocessable entity. Insufficient data`;
      } else if (error.error instanceof ErrorEvent) {
        errorMessage = `${operation}: ${error.error.message}`;
      } else {
        errorMessage = `${operation}: ${error.statusText || 'Unexpected server error'}`;
      }

      console.error(`[QualiTrack API Error] ${errorMessage}`, error);
      return throwError(() => new Error(errorMessage));
    };
  }
}
