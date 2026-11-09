---
name: haycee-valdi-idempotency
description: Prevent duplicate effects from repeated taps in Haycee Valdi buttons, navigation, sheets, forms, feeds, and async actions. Use when adding or changing interactive UI or reviewing duplicate submissions/screens.
---

# Haycee Valdi interaction idempotency

Apply this skill whenever a screen adds or changes tap handlers, navigation, a sheet/dialog, a form submission, pagination, or another asynchronous UI action. Follow the repository's `valdi-expert` skill for Valdi APIs and this skill for duplicate-effect behavior.

## First classify the action

Do not debounce every tap indiscriminately. Decide what repeated input means for each action:

- **Single-flight actions:** opening a page/sheet, submitting a form, confirming an operation, sending a message/media, starting an upload, or starting a fetch-more request. A second invocation while the first is pending must not start another effect.
- **Idempotent state selection:** selecting a tab, radio option, category, payment method, or address should set the requested value. Re-selecting it must leave the same state; avoid implementing these as blind toggles.
- **Intentionally repeatable actions:** quantity `+/-`, reactions/taps, scrolling, and similar controls may accept repeated input. Enforce their domain limits (stock, bounds, permissions) instead of suppressing legitimate repeats with a generic timer.

## Use the existing shared guards

### Navigation

Use `runNavigationAction(this.navigationController, () => { ... })` for every user-triggered `push` and `present`, including routes initiated from nested callbacks. Do not call `navigationController.push()` or `.present()` directly from UI handlers.

The helper in `modules/haycee_mobile_app_valdi/src/design-system/utils/NavigationActionGate.ts` is an app-wide single-flight guard with a 650 ms window. Keep all route entry points behind it so rapid taps from separate controls/controllers cannot stack pages during one transition. Do not lengthen the window casually: it temporarily blocks other navigation actions too. Dismiss/pop is not the same operation; do not wrap a sheet's close action in this guard because a newly opened sheet could be prevented from closing during the window.

Valdi's pinned Android `NavigationView` implementation adds every `push` to its stack and animates for 250 ms; it does not deduplicate repeated pushes. See `S:\valdi-official-reference\valdi\src\android_support\java\com\snap\valdi\support\NavigationView.kt` and `DefaultNavigator.kt`. The source revision is recorded in `docs/valdi-reference/SOURCE_MANIFEST.json` (Valdi beta-0.2.1, commit `f26bee4dc170b6c929f71d4dd07d44e033f47176`). Re-check the pinned reference if those versions change.

### Buttons and async callbacks

- Prefer the shared `DSButton`/`AsyncActionButton` for actions that can return a promise. Return the promise from the callback; the component prevents re-entry, shows its pending state, and re-enables after resolve/reject.
- For a raw Valdi `<view onTap>`, set a component-local pending flag **before** invoking/awaiting work, expose it through `onTapDisabled` and accessibility disabled state, then release it in `finally` (or the synchronous error path).
- Keep a disabled visual state synchronized with the actual guard. A disabled style alone is not a guard.
- A synchronous callback is protected only during that handler call; if it starts asynchronous work, make it return/await that work or manage a local pending flag explicitly.
- Preserve useful failure behavior: report the error, restore pending state, and keep the user on the current sheet/page when retry is valid.

### Sheets and dialogs

- Route the close button, overlay tap, gesture dismissal, and cancel action through one per-instance dismiss handler. Make that handler one-shot while dismissal is in progress so multiple native events cannot pop successive pages.
- For async confirm/option actions, lock before calling user code, disable conflicting controls, dismiss once after success, and restore the action state after failure. `ActionSheet` and `AlertDialog` are the reference implementations.
- Use `BottomSheetFooter`/`AsyncActionButton` for async footer actions and pass `disabled`/`loading` from real state. Do not assume that `BottomSheet` presentation itself makes its content actions single-flight.
- Do not use the global navigation cooldown to prevent repeated dismissals. A close guard belongs to the sheet instance and should not block opening or closing an unrelated page.

### Forms, messages, and feeds

- Validate all constraints before enabling submit, then keep a second synchronous in-flight guard in the handler. Validation and disabled state improve UX; the handler guard prevents duplicate effects.
- For fetch-more/pagination, guard with a request-pending flag, update the cursor/page only once, and release the flag on both success and failure. Repeated scroll-end events must not request the same page twice.
- For message/media sends and uploads, guard at the operation owner, not only the visual button, because the same callback may be reachable from another control.
- For async work tied to a component, follow `.codex/skills/valdi-async/SKILL.md`: cancel supported requests/subscriptions on replacement or destroy, and guard state updates after awaits with `isDestroyed()`.

## Server-side boundary

These UI guards prevent accidental duplicate taps in this client. They do not guarantee exactly-once behavior across retries, process restarts, network timeouts, or multiple devices. When a real backend mutation is added (payment, order, follow, message, upload, etc.), use the API's idempotency key or deduplication contract and keep the client guard as a UX safeguard. Never claim a demo-only local flag makes a production mutation idempotent.

## Screen review checklist

Before finishing an interactive screen:

1. List each tap action and classify it as single-flight, idempotent selection, or intentionally repeatable.
2. Search for all navigation calls and ensure each `push`/`present` uses `runNavigationAction`:

   ```powershell
   rg -n 'navigationController\.(push|present)\(' modules/haycee_mobile_app_valdi/src
   ```

3. Check that a page/sheet cannot be dismissed twice through close, overlay, cancel, or gesture paths.
4. Check async buttons, footer actions, confirmations, sends, and pagination for a synchronous guard, proper pending UI, failure recovery, and lifecycle safety.
5. Keep repeated controls (for example quantity and live reactions) responsive while enforcing their own limits.
6. Search the pinned Valdi API/reference before adding props, lifecycle hooks, or platform-specific assumptions; follow `valdi-expert`.
7. Validate with the smallest supported Valdi check. If the user's hot reload/build owns the Bazel process or disk space is constrained, do not start a competing build; report that verification is pending.
