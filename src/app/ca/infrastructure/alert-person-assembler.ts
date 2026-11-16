import { AlertPerson } from '../domain/model/alert-person.entity';
import {
  AlertOwnProfileResource,
  AlertStaffResource,
  AlertUserResource,
} from './alert-person-response';

/**
 * Brings together what the platform knows about the people of a laboratory.
 */
export class AlertPersonAssembler {
  /**
   * Gives each account the best name available.
   *
   * @param users - Accounts of the laboratory
   * @param staff - Staff members of the laboratory
   * @param ownProfile - Profile of the signed-in user, or null when it could not be read
   * @returns One person per account
   *
   * @remarks
   * Staff members and the signed-in user are named by their full name. The owner of the laboratory is not a staff
   * member and other people cannot read their profile, so for them it is the username.
   */
  toEntities(
    users: AlertUserResource[],
    staff: AlertStaffResource[],
    ownProfile: AlertOwnProfileResource | null,
  ): AlertPerson[] {
    const names = new Map(users.map((user) => [user.id, user.username]));
    for (const member of staff) {
      if (member.userId !== null) names.set(member.userId, member.fullName);
    }
    if (ownProfile?.fullName) names.set(ownProfile.userId, ownProfile.fullName);
    return [...names].map(([id, name]) => new AlertPerson({ id, name }));
  }
}
