import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../application/iam.store';

/**
 * Builds a guard that lets the user in when they hold the access, and otherwise sends them to the
 * dashboard. The platform enforces the same rules; the guards only avoid views the user cannot use.
 */
function roleGuard(allowed: (iam: IamStore) => boolean): CanActivateFn {
  return () => {
    const iam = inject(IamStore);
    return allowed(iam) || inject(Router).parseUrl('/dashboard');
  };
}

/** Views reserved to quality managers: subscription, billing and staff registration. */
export const qualityManagerGuard = roleGuard((iam) => iam.canManageQuality());

/** Views that register operational records, closed to auditors who only consult. */
export const operatorGuard = roleGuard((iam) => iam.canOperate());

/** Views that consult the activity of the staff: quality managers and auditors. */
export const staffActivityGuard = roleGuard((iam) => iam.canManageQuality() || iam.isAuditor());
