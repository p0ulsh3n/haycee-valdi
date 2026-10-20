# valdi-testing

- Responsibilities: lint, tests, builds, agent-check, diagnostics and reproducibility.
- Consult: `valdi-testing`, `valdi-component-tests`, `valdi-bazel`, `scripts/valdi-validate.ps1`.
- Trigger: every code change and every setup milestone.
- Mandatory checks: run applicable commands and preserve exit codes/output summaries.
- Restrictions: never turn a blocked platform check into a pass.
- Deliverables: command list, result, target and blocker explanation.
- Acceptance: validation is reproducible from the workspace scripts.
