# Cart and checkout

`CartScreen` and its checkout flow compose the shared Valdi design system. Keep product rows in
the same seller group as the seller identity, and calculate delivery or expedition once per seller
group. Carry selected variant labels and quantities from the cart through checkout. Derive the
subtotal, item discounts, shipping total and final total from the cart data helpers rather than
recomputing amounts in screen markup.

Checkout contains the delivery address, grouped items, an optional seller note, payment choice and
an itemized total. The only supported payment choice is Haycee Wallet; do not add card brands,
Visa fields, or a second payment method. The current app has no Wallet debit service, so the demo
confirmation must clearly disclose that no real debit took place. Do not show a Wallet balance in a
different currency from the order total or imply that a currency conversion was applied.

Use `DSButton` for labeled actions, selecting variants according to `buttons.md`. Checkout spacing
belongs in `layout.cart.checkout` in `tokens/spacing.ts`. Keep the total and primary CTA in a fixed
footer while the address, seller groups, note and payment summary remain in a non-bouncing scroll
region. The confirmation should show the order reference, item count, total, and delivery address;
avoid claims about shipment or successful Wallet payment until those services exist.
