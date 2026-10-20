# Agent operating guide

1. Start with `AGENTS.md` and the local `valdi-expert` skill.
2. Select the smallest profile in `.codex/agents/` for the task.
3. Search `docs/valdi-reference/API_INDEX.json`, then open the linked official source at the
   recorded commit.
4. Read the relevant official client skill before writing Valdi code.
5. Reuse official modules and elements; do not add a dependency until its provenance and need are
   verified.
6. Run `scripts/valdi-validate.ps1`, or the narrowest applicable Valdi check, and preserve the
   actual exit code.
7. If a platform is unavailable, mark it blocked. Do not substitute a visual guess for a build or
   test result.

For maintenance, run `scripts/update-valdi-skills.ps1`, then
`scripts/refresh-valdi-reference.ps1` and `scripts/valdi-api-self-test.ps1`. The checked-in CI
workflow performs static evidence checks only and intentionally does not claim mobile platform
builds.

The profiles are reusable instruction documents, not claims that nine autonomous agents are
running. Codex remains the active orchestrator in this environment.
