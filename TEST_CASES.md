# Test Case Inventory

All cases carry `@regression`. `@ui`, `@functional`, `@negative`, `@auth`, `@cart`, `@checkout`, `@coupon`, `@subtotal`, `@customer` and `@order` provide additional report filters. Customer cases are TC-04 and TC-22–26; the other 21 run without credentials. Each case has its own browser context and can run independently.

| ID | Flow | Expected Result |
| --- | --- | --- |
| TC-01 | Login with empty fields | Required-field validation blocks submit; no login request |
| TC-02 | Login with malformed email | Browser validation rejects the email; stays logged out |
| TC-03 | Login with invalid credentials | Server error shown; protected profile still redirects to login |
| TC-04 | Valid login and refresh | Customer profile loads and authenticated session persists |
| TC-05 | Homepage sections | Banner image, benefits, products, story links and footer render |
| TC-06 | Mobile bottom navigation | Correct Home icon, five actions, Campaigns route, no horizontal overflow |
| TC-07 | Header product search | Opens a modal without navigating; submission opens filtered listing |
| TC-08 | Product listing cards | Product name, real loaded image, price and details navigation work |
| TC-09 | Category filter | All displayed products belong to the selected category |
| TC-10 | Price sort | Whole listing sorts correctly in ascending and descending order |
| TC-11 | No-result search and clear | Empty state appears; clear restores products |
| TC-12 | Product details | Main image loads; price, stock, quantity and purchase actions render |
| TC-13 | Attribute selection | Alternate available variant is selected and the correct SKU enters cart |
| TC-14 | Product image zoom | Mobile preview zooms in/out, resets and closes; no overflow |
| TC-15 | Add to cart | Correct product image, unit price, subtotal and quantity 1 |
| TC-16 | Duplicate SKU addition | Same SKU merges into one row with quantity 2 |
| TC-17 | Quantity +2 | Two increment clicks change 1 to 3; line total and subtotal recalculate |
| TC-18 | Quantity 0 | Item removed; empty cart persists after reload |
| TC-19 | Quantity -1 | Negative value rejected; quantity and positive total survive reload |
| TC-20 | Cart persistence | Quantity and totals remain after reload and shop navigation |
| TC-21 | Guest checkout | Cart checkout and direct checkout both require login; return URL retained |
| TC-22 | Address and consent validation | Required address fields block save; address selection and consent gate submit |
| TC-23 | Invalid coupon (@coupon) | Checkout starts enabled after consent; invalid coupon shows an error and disables submit; removing it restores the original total and enables checkout |
| TC-24 | Full COD checkout | Product → cart → marked test address → quote → consent → one real order; details, unpaid status, total and emptied cart verified |
| TC-25 | Logout | Session ends; profile and checkout remain protected after reload |
| TC-26 | Valid coupon apply/remove | Configured discount applied exactly; subtotal stays unchanged; discounted tax and final total reconcile; removing the coupon restores the original total |
| TC-27 | Multi-product subtotal | Two distinct products with quantities 2 and 3 sum correctly; changing quantity and removing a line updates subtotal; remaining subtotal persists after reload |

TC-26 requires `TEST_COUPON_CODE` and `TEST_COUPON_EXPECTED_DISCOUNT`, plus dedicated customer credentials. It verifies checkout calculations without submitting an order. There are now **27 test definitions**.

TC-24 attaches the real created order ID/number and test marker to the HTML report. Each full run consumes one unit of staging stock. No automatic retries or silent expected failures are configured. Missing staging features/data should fail explicitly rather than be replaced by mock behavior.
