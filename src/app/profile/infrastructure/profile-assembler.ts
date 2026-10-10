import { Profile } from '../domain/model/profile.entity';
import { ProfileResource } from './profile-response';

/**
 * Converts the profiles sent by the platform into domain entities.
 *
 * @remarks
 * Transforms {@link ProfileResource} (the HTTP contract) into {@link Profile} (the domain entity). The profile is only
 * read from the platform; updates travel as an {@link UpdateProfileRequest}, so there is no conversion back.
 */
export class ProfileAssembler {
  /**
   * Converts a profile resource into a domain entity.
   *
   * @param resource - Profile as the platform sends it
   * @returns A new Profile entity identified by the user id
   */
  toEntityFromResource(resource: ProfileResource): Profile {
    return new Profile({ ...resource });
  }
}
