# QualiTrack Web Application (qualitrack-web-app)

## Overview
QualiTrack is a quality management platform for pharmaceutical laboratories. It digitizes the supervision of manufacturing processes with IoT devices, helps laboratories comply with Good Manufacturing Practices (GMP), reduces human error and improves the traceability of the information generated during laboratory operations.

This repository contains the web application built by **IoTech**. It consumes the QualiTrack Spring Boot REST API and is organized by bounded contexts following Domain-Driven Design.

## Features
- **Identity & Access**: Sign up, sign in, role-based access (e.g. quality manager), onboarding of new accounts, password recovery with an e-mailed verification code and password change.
- **Laboratory Management**: Laboratory profile, staff registration, details and deactivation, environments with their usage assignments, and raw material details.
- **Equipment Management**: Equipment and device registration, BPM configuration, status changes and maintenance records.
- **Inventory Management**: Raw material catalogue, material registration, raw material batches with quality review, container assignment, movements, usages and imports of pre-inventory records.
- **Product Batch Management**: Product catalogue, batch creation, release and rejection, raw material and equipment usage, staff participation, storage assignment and full batch traceability.
- **Tracking & Telemetry**: Environmental monitoring, telemetry history, environmental profiles, thresholds and actuation rules.
- **Compliance & Alerting**: Deviation alert dashboard, alert history and detail, acknowledgement and resolution of alerts, in-app notifications and notification preferences.
- **Reporting & Audit**: KPI dashboard, deviation trend charts, audit log viewer and report generator (including inventory reports).
- **Payments & Subscriptions**: Plan catalogue, Stripe checkout, payment result pages, billing summary and cancellation requests.
- **Profile**: Account and profile of the signed-in user, including the profile photo.
- **Multilingual Support**: Switch between English (`en_US`) and Spanish (`es_419`).

## Technologies
- Angular framework (standalone components, lazy-loaded routes).
- TypeScript language.
- Angular Material UI Component Library.
- Angular HTTP client.
- Angular Signals and reactive state management.
- NGX-Translate library.
- Chart.js with ng2-charts.
- Playwright for browser and system tests.
- Stripe for subscription payments (through the backend).

## Architecture
Each bounded context lives in `src/app/<context>` and is split in four layers:

```
src/app/<context>/
├── domain/          # entities, value objects and commands
├── application/     # stores (state and use cases)
├── infrastructure/  # API endpoints, assemblers, requests and responses
└── presentation/    # views, components and routes
```

| Folder | Bounded context |
|---|---|
| `iam` | Identity & Access Management |
| `laboratory` | Laboratory Management |
| `equipment` | Equipment Management |
| `inventory` | Inventory Management |
| `tracking` | Tracking & Telemetry |
| `batch` | Product Batch Management |
| `ca` | Compliance & Alerting |
| `ra` | Reporting & Audit |
| `subscription` | Payments & Subscriptions |
| `profile` | Profile |
| `shared` | Layout, dashboard, home, about and common components |

## Documentation
- **Class Diagrams**: The frontend class diagram of every bounded context is available in [docs/diagrams](docs/diagrams), one folder per context.
- **Project Report**: Requirements, domain model, architecture and design decisions are documented in the [QualiTrack report](https://github.com/Experimentos-1ASI0732-2620-9104/report-).

## Environment Variables
The API endpoints are configured in `src/environments`:
- `environment.development.ts`: used by `ng serve`. It points to the API at `http://localhost:8080/api/v1`.
- `environment.ts`: used by production builds. It points to the deployed API.

Change `serverBasePath` in the corresponding file to use a different backend.

## Development server

To start a local development server, run:

```bash
npm install
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files. The QualiTrack backend must be running for the API calls to work.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev) test runner, use the following command:

```bash
ng test
```

## Running browser tests

The scripts in `tests/*.mjs` drive a real browser with Playwright to check the main views (dashboard, inventory, onboarding, report generator, Stripe catalog and responsive layout). With the web app running, execute one of them with Node, for example:

```bash
node tests/responsive.mjs
```

## Running system tests

The system test in `tests/system` runs the quality manager journey with a real browser, the real Angular app and the real Spring Boot API, without route mocks. Start the backend with its isolated system-test server and the web app with `npm start`, then run:

```bash
npm run test:system
```

The `WEB_URL`, `API_URL`, `SYSTEM_USERNAME` and `SYSTEM_PASSWORD` environment variables override the defaults.

## Legacy fixtures
The `server` folder keeps historical JSON Server fixtures for local use only. The application does not use them; it works against the Spring Boot API.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
