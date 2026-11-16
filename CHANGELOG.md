# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-11-16

### Added
- Equipment Management (`equipment`): a quality manager registers an Edge Gateway, sees whether it has an API key and generates it once it is located and operational; the key is shown only once. Each environment has a view with its Edge Gateways, the IoT devices each one covers (up to 15), its devices and its process equipment, and the equipment list filters by environment and by Edge Gateways.
- Compliance & Alerting (`ca`): the active alerts are a prioritized inbox across every environment, grouped by severity, with a bar of the reading against its limit, a refresh every 30 seconds and keyboard shortcuts. The detail of an alert is a panel that guides the person through its next step: register attention, which can be undone for 5 seconds, and then resolve with a corrective action.
- Compliance & Alerting (`ca`): the alert history filters by period, severity, status, origin and text, shows the share resolved and the average attention and resolution times, a weekly chart, and exports the same environment and period to the report generator.
- Product Batch Management (`batch`): the batch list shows indicators by status that also filter it, a search, an environment filter, a start date range and sorting; the detail of a batch has a summary and a traceability timeline, and names who registered each step.
- Reporting & Audit (`ra`): the environmental summary evaluates each card against the thresholds of its device, the deviation indicators have a detail page for each variable, and the report generator works in two steps and reads its parameters from the address.
- Payments & Subscriptions (`subscription`): a plan chosen on the website is remembered through sign-up and sign-in, and someone who already pays for a plan gets a notice that explains how to switch.
- Shared (`shared`): every page of a module opens with the same header and every list with the same toolbar; tables have 10, 25 or 50 rows per page and become one card per row on phones; design tokens of the style guide (`--qt-*`), `EmptyState`, `ErrorBanner`, `StatusChip`, `SidePanel`, the `dateOnly` and `elapsedTime` pipes, and `EnvironmentPreference`, which remembers the environment opened in inventory, production and monitoring.
- Unit tests with Vitest for validators, forms, stores, assemblers and views (870 tests), and an alerts browser test in `tests/alerts-browser.mjs`.

### Changed
- Dependencies: Angular 22.2, Angular Material and CDK 22.2, ngx-translate 18.1 and TypeScript 6.0.
- Routing: every bounded context uses semantic routes that name the resource instead of the view (`/equipments/new`, `/alerts/:alertId`, `/laboratories/new`); the view-named paths only redirect to them.
- Internationalization: the language files and codes are `en` and `es` instead of `en_US` and `es_419`, and every date follows the chosen language and the time zone of the laboratories.
- Forms: laboratory, profile, sign-up, batch, inventory, equipment, report and threshold forms validate their fields against the limits of the API.
- Stores: every store is provided in root, signing out reloads the application, and each bounded context reads the data of the others through its own models and endpoints; `shared` no longer imports any bounded context and the operational overview moved to Reporting & Audit.
- Inventory Management (`inventory`): the catalogue and the lots near expiry are two tabs of the inventory page, and the views are split into components.
- Presentation: the views share one visual language with the Rubik typeface, each view owns its stylesheet, and the side menu groups its options by operation, quality and administration.
- System test of the quality manager journey (`tests/system`) follows the semantic routes and the attention step of the alert detail.
- Project version set to `1.1.0`.

### Removed
- Compliance & Alerting (`ca`): the `DeviationDetail` view, replaced by the detail panel.
- Shared (`shared`): the `Toolbar` component and the shared operations, Tracking and Reporting page stylesheets.
- Laboratory Management (`laboratory`): `EnvironmentStore` and the raw material detail, now part of Inventory.

### Fixed
- Identity & Access (`iam`): the home page, sign-in, sign-up and password recovery are only for visitors; whoever still has a session goes to the dashboard.
- Payments & Subscriptions (`subscription`): while the laboratory pays for a plan, the plans view no longer offers buttons that do nothing, and the billing summary calls the start of the current period "Current Period From".
- Reporting & Audit (`ra`): the report preview generates the report once, and the deviation chart only draws the limits configured for the variable.
- Shared (`shared`): the browser tab shows the title of the current page in the language of the application, and table cells break only between words.

## [1.0.2] - 2026-10-10

### Fixed
- System test of the quality manager journey (`tests/system`) aligned with the environment-scoped API: the deviation is reported through the environmental device of an environment, registering an equipment opens its detail view, and the resolve form is validated on submit.

## [1.0.1] - 2026-10-10

### Fixed
- Project report link in `README.md` now points to the correct repository.

## [1.0.0] - 2026-10-10

### Added
- Identity & Access (`iam`): sign up, sign in, onboarding, role-based guards, password recovery with an e-mailed verification code and password change.
- Laboratory Management (`laboratory`): laboratory profile, staff registration, details and deactivation, environments with usage assignments, and raw material details.
- Equipment Management (`equipment`): equipment and device registration, BPM configuration, status changes and maintenance records.
- Inventory Management (`inventory`): raw material catalogue, material registration, raw material batches with quality review, container assignment, movements, usages and imports of pre-inventory records.
- Product Batch Management (`batch`): product catalogue, batch creation, release and rejection, raw material and equipment usage, staff participation, storage assignment and batch traceability.
- Tracking & Telemetry (`tracking`): environmental monitoring, telemetry history, environmental profiles, thresholds and actuation rules.
- Compliance & Alerting (`ca`): deviation alert dashboard, alert history and detail, alert acknowledgement and resolution, in-app notifications and notification preferences.
- Reporting & Audit (`ra`): KPI dashboard, deviation trend charts, audit log viewer, report generator and inventory reports.
- Payments & Subscriptions (`subscription`): plan catalogue, Stripe checkout, payment result pages, billing summary and cancellation requests.
- Profile (`profile`): account and profile of the signed-in user, including the profile photo.
- Shared layout with home, about, dashboard and page-not-found views, and a language switcher for English (`en_US`) and Spanish (`es_419`).
- Frontend class diagrams for every bounded context in `docs/diagrams`.
- Browser tests with Playwright in `tests/` and a system test of the quality manager journey in `tests/system`.
- `README.md` describing features, architecture, environment configuration and testing.

### Changed
- Updated the API endpoint paths in `src/environments` to match the QualiTrack Spring Boot API.
- Raised the production bundle size budget to 1.2MB in `angular.json`.

### Removed
- GitHub Actions workflows from `.github/workflows`.
