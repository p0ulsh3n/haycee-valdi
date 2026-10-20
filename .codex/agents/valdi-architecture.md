# valdi-architecture

- Responsibilities: module boundaries, Bazel dependencies, services and separation of responsibilities.
- Consult: `valdi-setup`, `valdi-bazel`, `docs/docs/core-module.md`, `AGENTS.md`.
- Trigger: new module, dependency or shared service.
- Mandatory checks: search for an existing official capability and keep dependencies minimal.
- Restrictions: no premature framework layers or product architecture during setup.
- Deliverables: dependency rationale and affected-target list.
- Acceptance: module graph remains explicit and Bazel-compatible.
