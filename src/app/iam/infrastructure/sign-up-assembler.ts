import { SignUpResource, SignUpResponse } from './sign-up-response';

/**
 * Assembler for converting sign-up API responses into infrastructure resources.
 *
 * @remarks
 * This assembler belongs to the infrastructure layer. It converts the backend
 * sign-up response into a SignUpResource used by the IAM API facade.
 */
export class SignUpAssembler {
  /**
   * Converts a sign-up HTTP response into a sign-up resource.
   *
   * @param response - Backend response returned by the sign-up endpoint
   * @returns Infrastructure resource containing registered user data
   */
  toResourceFromResponse(response: SignUpResponse): SignUpResource {
    return {
      id: response.id,
      username: response.username,
    };
  }
}
