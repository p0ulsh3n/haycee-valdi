# Valdi validation results

Generated: 2026-10-22T20:54:38.2732547Z

| Check | Exit code | Status |
|---|---:|---|
| API/agent self-test | 0 | pass |
| Valdi CLI version | 0 | pass |
| Valdi doctor | 1 | fail-or-blocked |
| Valdi projectsync | 1 | fail-or-blocked |
| Valdi lint | 2 | fail-or-blocked |
| Valdi test | 1 | fail-or-blocked |
| Valdi agent-check | 2 | fail-or-blocked |

Full command output is in `VALIDATION_RESULTS.json`. A non-zero result is preserved as a failure or environment block; it is not converted into a pass.
