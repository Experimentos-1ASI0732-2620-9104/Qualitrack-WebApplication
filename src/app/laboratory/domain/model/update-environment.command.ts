/**
 * Command for updating the identification data of an environment.
 *
 * @remarks
 * The usage is not part of this command; it changes through a usage assignment.
 */
export interface UpdateEnvironmentCommand {
  /**
   * Identification of the environment, unique within the laboratory.
   */
  code: string;

  /**
   * Display name of the environment.
   */
  name: string;

  /**
   * Optional description of the environment.
   */
  description: string | null;
}
