## 1. Faro Wrapper Foundation

- [x] 1.1 Add the Grafana Faro Web SDK dependency and any required build or package metadata updates for the wrapper implementation.
- [x] 1.2 Introduce internal Faro client setup modules that keep provider-specific initialization out of the public package surface.
- [x] 1.3 Refactor runtime config normalization so browser-safe environment, ingest, and metadata inputs are validated and translated into Faro-backed initialization.

## 2. Core Runtime Contract

- [x] 2.1 Rework `createFrontendObservability` and the core runtime implementation to delegate telemetry delivery to Faro while preserving the current package-owned facade.
- [x] 2.2 Keep user-context normalization and update flows package-owned and map them into the Faro-backed runtime without requiring reinitialization.
- [x] 2.3 Preserve request-correlation header helpers and ensure their conventions remain provider-neutral for consumers.
- [x] 2.4 Preserve package-owned page-view, client-error, and Web Vitals hook points on top of the Faro-backed implementation.

## 3. Adapter Alignment

- [x] 3.1 Update the `react` entrypoint so app bootstrap continues to attach the shared runtime without exposing Faro setup in consumer code.
- [x] 3.2 Update the `react-router` entrypoint so route tracking still flows through package-owned helpers over the Faro-backed runtime.
- [x] 3.3 Update the `frontend-web` helpers so auth-driven user-context and protected-request correlation remain aligned with the wrapper contract.

## 4. Tests And Documentation

- [x] 4.1 Update or add runtime tests covering disabled mode, config normalization, metadata normalization, user-context normalization, and Faro translation behavior.
- [x] 4.2 Update or add adapter tests covering React, React Router, and `frontend-web` integration behavior under the wrapper architecture.
- [x] 4.3 Refresh `README.md`, `docs/frontend-observability-runtime.md`, and any package guidance so the package is documented as a platform wrapper on top of Grafana Faro.
- [x] 4.4 Document the final implementation decisions on Faro surface exposure, future backend flexibility, and any `frontend-web` contract changes discovered during implementation.

## 5. Validation And Archive

- [x] 5.1 Run repo validation commands for this change, including `bun run typecheck`, `make lint`, `make test`, `make build`, `make package-check`, `make format-check`, and `make sync-agent-skills-check`.
- [x] 5.2 Validate the updated OpenSpec artifacts and archive the completed change once implementation is finished.
