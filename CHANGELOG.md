# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
