# ANWAR Storefront Automation

Independent Playwright + TypeScript project with Page Object Models (POM), **27 test cases**, and the Playwright HTML Report. It exercises the real staging UI and backend. It does not import application code, seed carts via localStorage, mock API responses, or add tests to any of the three applications.

## Setup

Use Node.js 22 LTS or later.

```bash
cd ecommerce-automation
npm ci
npm run browsers:install
cp .env.example .env
```

If `.env` already exists, edit it instead of overwriting it. Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` to a dedicated **customer** account. `BASE_URL` defaults to `https://ecommerce-storefront-swart.vercel.app`. Existing environment variables take precedence over `.env`.

The staging catalog needs a published product whose initially selected SKU has at least three units available, another available attribute option for TC-13, active banners, homepage product sections, and enabled COD. Product selection happens through the UI and is cached per worker. Set `TEST_PRODUCT_SLUG` to pin the cart/checkout product if needed. TC-27 also needs a second distinct product with at least three units in its initially selected SKU. No customer/admin credentials are copied from other apps.

TC-26 verifies a **successful coupon application** and removal without placing an order. Set `TEST_COUPON_CODE` to an active coupon eligible for the pinned product, quantity 1, and test customer. Set `TEST_COUPON_EXPECTED_DISCOUNT` to its expected BDT discount (for example `100.50`), accounting for percentage/fixed rules and any cap. The amount is an independent test expectation, not copied from the API response. The product must meet any minimum spend and campaign coupon restrictions. Missing coupon settings fail TC-26 clearly.

## Run And Report

```bash
npm run typecheck
npm run test:list           # Exactly 27 test definitions
npm test                    # All 27, including one real COD order
npm run report              # Open Playwright HTML Report
```

```bash
npm run test:ui             # UI checks, including desktop and mobile viewports
npm run test:functional     # Functional checks
npm run test:regression     # All 27 cases
npm run test:public         # 21 checks that do not need customer credentials
npm run test:coupon         # TC-23 invalid coupon and TC-26 valid coupon
npm run test:headed
npm run test:debug
npm test -- --grep TC-17    # Run a single case independently
npm test -- --grep TC-26    # Valid coupon: requires customer + coupon config
npm test -- --grep TC-27    # Multi-product subtotal: no login required
```

Tags overlap: UI and functional checks are all regression cases; these commands filter the same 27 definitions rather than duplicate them. Chromium is the default browser. Set `TEST_BROWSER_CHANNEL=chrome` to use an installed Google Chrome instead. No local app is started because this suite targets staging.

`maxFailures: 0` keeps the run going after a failure. A missing UI option or other assertion failure is reported as **Failed**, and the next independent testcase runs. Errors are not caught or converted into passes. After all selected cases finish, the command exits with code 1 if any case failed; the final stack trace and nonzero exit code do not mean the remaining cases were stopped.

The report is generated after each run at `playwright-report/index.html`, with failure screenshots, retained traces/videos, step details, and attachments. Machine-readable results are written to `test-results/results.json`. Reports and browser artifacts can include customer details and session data, so they are ignored by Git along with `.env`.

See [RUN_REPORT.md](RUN_REPORT.md) for the latest staging execution result and the reproduced sort-dropdown defect. The suite reports that defect as a real failure; no expected-failure marker or workaround hides it.

Both coupon cases have now passed using the configured customer and BDT 200 expected discount. The latest HTML report includes the 26 cases rerun after corrections; TC-24 was excluded from that refresh because its single real COD order had already passed verification. Its receipt and the execution history are documented in `RUN_REPORT.md`. Test-list commands use only the list reporter so discovery preserves completed HTML/JSON reports.

## Order And Test Data

`ALLOW_ORDER_CREATION=true` enables TC-24, which submits **one actual COD order per run**. The order and its test delivery address are marked **AUTOMATION TEST - DO NOT SHIP OR FULFIL**. The order ID/number is attached to the report immediately after the server responds, with a second receipt attachment after UI verification. The test does not fulfil, pay, cancel, or delete the order; it remains available for review in admin. Inventory is reserved according to the real order flow.

Set `ALLOW_ORDER_CREATION=false` for a run without order submission. TC-24 will be visibly **skipped**, not passed. Automatic retries are disabled and one worker runs at a time. Manually rerunning TC-24 or the full suite creates another order; inspect the prior report if the submit result was uncertain.

Tests create/reuse only their configured marked address through the UI. Existing customer addresses are not edited or deleted. Cart state and login cookies are isolated in a fresh browser context for each case. Valid authentication uses the login UI, not saved sessions or API login. Missing credentials fail `@customer` cases with an actionable message; they are not silently skipped.

## Structure

```text
ecommerce-automation/
  config/environment.ts         # Independent dotenv settings
  fixtures/storefront.fixture.ts # POM fixtures, customer login, UI product discovery
  pages/                        # Selectors and reusable page actions
  tests/                        # Exactly 27 UI/functional/regression cases
  utils/money.ts                # Displayed currency assertions
  playwright.config.ts          # Browser, isolation, report and artifacts
  TEST_CASES.md                 # Case inventory and expected behavior
  .env.example
```

Page-object actions use arrow functions. Selectors prefer accessible roles and labels; small DOM selectors for product cards, price rows and visual radios are centralised in page objects. Tests use Playwright's assertions and auto-waiting instead of fixed sleeps. External services, shipping and payment gateways are not mocked.

Architecture and reporting follow the official [Playwright POM guide](https://playwright.dev/docs/pom) and [HTML reporter documentation](https://playwright.dev/docs/test-reporters#html-reporter).
