# Bottom sheets

`BottomSheet` is the shared navigation-page sheet. Its standard behavior remains the default. Use the optional `snapPointPercent` only when a flow needs a persistent partial-height sheet with an explicit expand control.

## Detent sheet

```ts
{
  title: 'Choisir une adresse',
  message: 'Sélectionnez où recevoir votre commande.',
  showOverlay: true,
  showHandle: true,
  enableGestures: true,
  snapPointPercent: 85,
}
```

`snapPointPercent` is the initial sheet height as a percentage of its parent, such as `80` or `85`. It must be greater than `0` and less than `100`. Omitting it, or passing an invalid value, preserves the standard sheet layout and behavior.

When enabled, the sheet opens at that fixed height and renders header actions to expand to `100%` or close. In the expanded state, the same expand control returns it to its configured initial height. Upward drags cannot exceed the configured initial detent. A downward drag settles back to the current detent, dismisses after a sufficiently long or fast swipe, or returns a maximized sheet to its initial detent after a moderate drag. The close icon, overlay dismissal, and drag dismissal share a per-sheet one-shot guard.

The implementation uses Valdi's native view drag events (`DragEvent.deltaY` and `velocityY`), `translationY`, and component state animations. The pinned official source is recorded in `docs/valdi-reference/SOURCE_MANIFEST.json` (Valdi beta-0.2.1, commit `f26bee4dc170b6c929f71d4dd07d44e033f47176`).

## Choosing a detent

- Use `80` or `85` when the sheet needs a large preview while keeping some of the presenting screen visible.
- Keep `snapPointPercent` unset for short action sheets and sheets whose existing geometry already fits the task.
- Use the explicit expand control for access to full-height content; the sheet does not expand from an upward drag past its initial detent.
- Keep long content in an internal scroll view, with the sheet header and footer outside that scroll view, when a feature-specific sheet needs scrolling.
