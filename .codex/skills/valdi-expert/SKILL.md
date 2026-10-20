---
name: valdi-expert
description: Verified Valdi application development using the pinned official source, generated API indexes, and official client skills.
---

# valdi-expert

Use this skill for every Valdi application change in this workspace.

## Required decision process

1. Identify the requested capability and search `docs/valdi-reference/API_INDEX.json` by name,
   concept and module path.
2. Open the linked source/document in `S:\valdi-official-reference` and confirm the exact
   import, signature, lifecycle and platform notes for the recorded revision.
3. Read the relevant official client skill in `.codex/skills/` before proposing code.
4. Reuse an existing Valdi element, component, service or module before creating a new one.
5. Reject React/React Native assumptions: no hooks, functional components, `this.props`, or
   unsupported web CSS patterns unless the evidence explicitly identifies a Valdi equivalent.
6. Keep the change inside the existing Bazel module structure and avoid unverified dependencies.
7. Run the smallest applicable validation, then the full project validation when the toolchain is
   available. Report unavailable platform/toolchain checks instead of treating them as passes.

## Search commands

```powershell
rg -n -i "term|ComponentName|import/path" docs/valdi-reference/API_INDEX.json S:\valdi-official-reference
rg -n "export (class|interface|type|function|const)" S:\valdi-official-reference\valdi_core S:\valdi-official-reference\modules
```

## Evidence requirements

Every non-trivial Valdi API decision must point to a source path and the commit in
`docs/valdi-reference/SOURCE_MANIFEST.json`. If no verified source exists, say that the
capability is unconfirmed and do not invent an implementation.
