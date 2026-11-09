# Selection components

Use `RadioSelection` for a single choice in a sheet or form. It places the label at the
left and the selected indicator at the right. The component is exported from the public
`src/design-system` barrel.

Set `disabled` for unavailable options, such as a sold-out product variant. Disabled rows
ignore taps, have a reduced visual emphasis, and expose the disabled state to accessibility
services. Keep the actual selection state in the owning screen or sheet and make
`onTap` assign the selected value; selecting the already active option should be a no-op.

```tsx
<RadioSelection
  label="Noir · Taille M · Épuisé"
  selected={selectedVariantId === variant.id}
  disabled={variant.remaining <= 0}
  onTap={() => selectVariant(variant.id)}
  accessibilityLabel="Noir, taille M, épuisé"
/>
```

Do not create screen-specific radio controls for ordinary single-choice lists. Extend the
shared component when repeated selection behavior or accessibility needs are missing.
