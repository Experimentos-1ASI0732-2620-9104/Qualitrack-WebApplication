import { SignInResource, SignInResponse } from './sign-in-response';

/**
 * Assembler for converting sign-in API responses into infrastructure resources.
 *
 * @remarks
 * This assembler belongs to the infrastructure layer. It converts the backend
 * sign-in response into a SignInResource used by the IAM API facade.
 *
 * Command-to-request mapping is intentionally handled by the application store
 * to keep the API endpoint focused on HTTP communication.
 */
export class SignInAssembler {
  /**
   * Converts a sign-in HTTP response into a sign-in resource.
   *
   * @param response - Backend response returned by the sign-in endpoint
   * @returns Infrastructure resource containing authenticated session data
   */
  toResourceFromResponse(response: SignInResponse): SignInResource {
    return {
      id: response.id,
      username: response.username,
      roles: response.roles,
      laboratoryId: response.laboratoryId ?? null,
      token: response.token,
    };
  }
}
