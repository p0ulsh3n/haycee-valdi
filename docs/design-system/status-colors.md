# Status colors

Use semantic status tokens from `modules/haycee_mobile_app_valdi/src/design-system/tokens/colors.ts` for order and fulfillment states. Do not reuse the lime brand accent or its contrast ink as a success or pending indicator.

| Meaning | Token | Order tracking use |
| --- | --- | --- |
| Pending / waiting for the next fulfillment step | `colors.interactivePending` | Preparation in progress and upcoming timeline steps. |
| Successfully shipped or delivered | `colors.interactiveSuccess` | Shipped/delivered status labels and completed/current fulfillment timeline points. |
| Cancelled or failed | `colors.interactiveDanger` | Cancellation/payment-failure status and the terminal cancellation point/connector. |

Keep upcoming steps visually distinct from completed steps: pending dots are yellow, while incomplete labels remain secondary text. A cancellation takes precedence over other state colors on its terminal point.
