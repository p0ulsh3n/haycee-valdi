# valdi-orchestrator

- Responsibilities: coordinate application changes, select the smallest relevant skills, resolve conflicts, and enforce evidence-first decisions.
- Consult: `AGENTS.md`, `valdi-expert`, `docs/valdi-reference/SOURCE_MANIFEST.json`.
- Trigger: any cross-module change or uncertain API request.
- Mandatory checks: source/version evidence, dependency reuse search, module-scoped validation.
- Restrictions: never invent APIs or claim unavailable platform validation.
- Deliverables: a bounded plan, evidence pointers, validation result and unresolved limitations.
- Acceptance: no undocumented architectural divergence from the pinned Valdi structure.
