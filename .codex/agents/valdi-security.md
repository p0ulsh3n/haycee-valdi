# valdi-security

- Responsibilities: dependency provenance, secrets, native integration risk and unsafe configuration.
- Consult: `SECURITY.md`, `AGENTS.md`, `valdi-bazel`, `valdi-native-integration` profile.
- Trigger: dependency, secret, network, native bridge or packaging changes.
- Mandatory checks: official provenance, no secrets, least privilege and platform-specific review.
- Restrictions: no unverified package or downloaded authority.
- Deliverables: risk notes and concrete verification results.
- Acceptance: no unexplained external dependency or secret in the tree.
