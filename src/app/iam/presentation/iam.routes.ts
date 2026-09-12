import { Routes } from '@angular/router';
import { iamGuard } from '../infrastructure/iam-guard';

/**
 * Lazy loads the sign-in form view component.
 *
 * @returns A Promise that resolves to the SignInForm component
 */
const signInForm = () => import('./views/sign-in-form/sign-in-form').then((m) => m.SignInForm);

/**
 * Lazy loads the sign-up form view component.
 *
 * @returns A Promise that resolves to the SignUpForm component
 */
const signUpForm = () => import('./views/sign-up-form/sign-up-form').then((m) => m.SignUpForm);

/**
 * Base title used by IAM routes.
 */
const baseTitle = 'QualiTrack';

/**
 * Routing configuration for the Identity and Access Management bounded context.
 *
 * @remarks
 * These routes expose authentication-related views such as sign-in and sign-up.
 * Unlike operational bounded contexts, IAM does not use the main application
 * layout because authentication screens render their own public toolbar.
 */
export const iamRoutes: Routes = [
  { path: 'onboarding', canActivate: [iamGuard],
    loadComponent: () => import('./views/onboarding/onboarding').then((m) => m.Onboarding) },
  { path: 'sign-in', loadComponent: signInForm, title: `Sign In | ${baseTitle}` },
  { path: 'sign-up', loadComponent: signUpForm, title: `Sign Up | ${baseTitle}` },
];
