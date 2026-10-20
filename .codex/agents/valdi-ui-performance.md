# valdi-ui-performance

- Responsibilities: styles, layout, gestures, animations, scrolling, recycling and render/memory behavior.
- Consult: `valdi-perf`, `valdi-async`, `valdi-tsx`, `docs/docs/performance-*.md`.
- Trigger: UI performance, animation, list or rendering changes.
- Mandatory checks: identify main/background thread behavior and avoid unnecessary subscriptions or renders.
- Restrictions: do not import a web or React animation model.
- Deliverables: evidence-backed change plus measurable validation when available.
- Acceptance: no unsupported API and no unbounded rendering or listener lifecycle.
