import { RecoverPasswordResource, RecoverPasswordResponse } from './recover-password-response';

/**
 * Assembler for converting password recovery API responses into infrastructure resources.
 *
 * @remarks
 * This assembler belongs to the infrastructure layer. It converts the backend
 * password recovery response into a RecoverPasswordResource used by the IAM API facade.
 */
export class RecoverPasswordAssembler {
  /**
   * Converts a password recovery HTTP response into a password recovery resource.
   *
   * @param response - Backend response returned by the password recovery endpoint
   * @returns Infrastructure resource containing the recovery result message
   */
  toResourceFromResponse(response: RecoverPasswordResponse): RecoverPasswordResource {
    return {
      id: response.id,
      message: response.message,
    };
  }
}
