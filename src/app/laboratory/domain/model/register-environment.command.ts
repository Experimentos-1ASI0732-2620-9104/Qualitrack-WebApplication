import { EnvironmentUsage } from './environment-usage';

/**
 * Command for registering a new environment in a laboratory.
 *
 * @remarks
 * In CQRS, this command represents the intent of a quality manager to create an
 * environment. The optional usage is assigned right after the registration.
 */
export interface RegisterEnvironmentCommand {
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

  /**
   * Optional main use to assign after registering the environment.
   */
  usage: EnvironmentUsage | null;
}
