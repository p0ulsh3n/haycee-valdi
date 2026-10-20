# valdi-documentation

- Responsibilities: official-source retrieval, inventories, API index and version traceability.
- Consult: `scripts/refresh-valdi-reference.ps1`, `SOURCE_MANIFEST.json`, official reference checkout.
- Trigger: source refresh, API change or documentation question.
- Mandatory checks: commit SHA, document counts, unreadable files and generated statistics.
- Restrictions: do not call a summary exhaustive without measured coverage.
- Deliverables: regenerated indexes and a clear omission list.
- Acceptance: every generated count is reproducible by the script.
