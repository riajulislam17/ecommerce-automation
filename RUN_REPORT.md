# Staging Verification — 8 November 2026

Target: `https://ecommerce-storefront-swart.vercel.app`  
Browser: Playwright Chromium, desktop plus explicit mobile viewport cases  
Final report command: `npm test -- --grep-invert @order --output=test-results/final-artifacts`

| Check | Result |
| --- | --- |
| TypeScript typecheck | Passed |
| Test discovery | Exactly 27 cases in 8 spec files |
| Initial full suite execution | All 27 executed, including a successful real COD order |
| Final report refresh | 26 executed: 25 passed, 1 failed; order submission excluded to avoid another order |
| Coupon cases | TC-23 and TC-26 both passed in the final report |
| Latest verified status across the initial order test and final refresh | 26 passed; 1 remaining failure — TC-10 |
| Cases awaiting credentials or configuration | None |
| Real orders submitted | Exactly 1, marked as an automation test |

The [final HTML report](playwright-report/index.html) and `test-results/results.json` contain the final 26-case refresh, including passing valid and invalid coupon cases. TC-24 passed in the earlier full run and was intentionally excluded from this refresh to avoid submitting another real order. Its receipt is preserved separately at `test-results/created-order.json`.

## Coupon Verification

- **TC-23 — invalid coupon: passed.** Checkout starts enabled after consent. A nonexistent coupon displays an error and disables order submission. Removing it restores the original total and enables checkout again.
- **TC-26 — valid coupon: passed on retest.** The configured coupon applies the expected **BDT 200** discount. Subtotal stays unchanged; tax and final total reconcile. Removing it restores the original quote and leaves checkout enabled.

The original TC-26 stopped because a displayed zero discount parsed as JavaScript `-0`; the currency helper now normalizes signed zero. A coupon-only run then exposed an expectation mismatch: `.env` specified BDT 10 while the coupon applied BDT 200. The user confirmed BDT 200 is correct and authorized updating `TEST_COUPON_EXPECTED_DISCOUNT=200`; both coupon cases then passed. No application code or coupon rules were changed.

The final refresh did not submit additional orders. It used:

```bash
npm test -- --grep-invert @order --output=test-results/final-artifacts
```

Open the final report with `npm run report`. Use `npm run test:coupon` to run just TC-23 and TC-26.

Playwright's configured HTML/JSON reporters also ran during `--list` discovery and replaced completed reports with a discovery snapshot. The config now selects only the list reporter for `--list`, and `test:list` explicitly requests that reporter. The final execution report was regenerated after this correction.

## Confirmed Order And Customer Flows

Valid login/session reload (TC-04), address/consent validation (TC-22), full COD checkout (TC-24), logout and protected routes (TC-25), and multi-product subtotal (TC-27) all passed. Credentials were loaded from `.env` and are not included here.

The single created test order is:

- Number: **ANW-MW7KMLX8-A3EDE4**
- ID: `aeb11639-316e-494c-84fa-af8250e76b48`
- Total: **BDT 6,960.00**
- Payment: COD, unpaid
- Instructions contain **AUTOMATION TEST - DO NOT SHIP OR FULFIL** and the TC-24 run marker.

The order details, submitted total, unpaid COD status and emptied cart were verified through the UI in the initial run. The receipt is preserved at `test-results/created-order.json`. The order was not paid, fulfilled or cancelled.

## Reproduced Defect: Product Price Sort

1. Open `/shop`.
2. Open **Sort** and select **Price: low to high**.
3. The product list correctly sorts ascending.
4. Reopen **Sort** and attempt to select **Price: high to low**.

Expected: all sort choices remain available, and the list can change to descending order.

Actual: the reopened dropdown only exposes **Newest first**. **Price: high to low** is missing, so TC-10 fails waiting for that visible user action. This reproduced after waiting for the previous selection and popup close. The failure screenshot, video and trace are attached to TC-10 in the HTML report. Application source was not changed by this automation task.

The sort-dropdown defect remains the only failing case after the coupon corrections and retest. No expected-failure annotation or workaround hides it.

## Local Sort Fix Verified

The storefront's central `SelectField` now disables internal filtering when `searchable=false`. The sort menu retains all three choices after repeated ascending/descending switches and a reset to Newest. Desktop (1440px), mobile (375px), and searchable category filtering/reset passed manual browser checks; the storefront production build also passed.

TC-08, TC-09, TC-10 and TC-11 all passed against the corrected local preview using staging catalog data. This separate local report is at [playwright-report/shop-sort-local/index.html](playwright-report/shop-sort-local/index.html). The earlier staging failure remains a historical result until the storefront fix is deployed and staging is retested.
