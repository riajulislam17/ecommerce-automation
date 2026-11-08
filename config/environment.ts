import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../.env"), quiet: true });

const baseUrl = new URL(
  process.env.BASE_URL || "https://ecommerce-storefront-swart.vercel.app",
);
if (
  !["https:", "http:"].includes(baseUrl.protocol) ||
  baseUrl.username ||
  baseUrl.password
)
  throw new Error(
    "BASE_URL must be an HTTP(S) storefront URL without credentials.",
  );

export const environment = {
  baseURL: baseUrl.origin,
  email: process.env.TEST_USER_EMAIL || "",
  password: process.env.TEST_USER_PASSWORD || "",
  productSlug: process.env.TEST_PRODUCT_SLUG || "",
  couponCode: (process.env.TEST_COUPON_CODE || "").trim().toUpperCase(),
  couponExpectedDiscount: process.env.TEST_COUPON_EXPECTED_DISCOUNT || "",
  allowOrderCreation: process.env.ALLOW_ORDER_CREATION === "true",
  browserChannel: process.env.TEST_BROWSER_CHANNEL || undefined,
  address: {
    label: process.env.TEST_ADDRESS_LABEL || "Automation QA - Do Not Ship",
    name: process.env.TEST_RECIPIENT_NAME || "Automation Test Customer",
    phone: process.env.TEST_RECIPIENT_PHONE || "01700000000",
    area: process.env.TEST_ADDRESS_AREA || "Dhaka",
    line:
      process.env.TEST_ADDRESS_LINE ||
      "AUTOMATION TEST ONLY - DO NOT SHIP OR FULFIL",
  },
};

export const requireCustomer = () => {
  if (!environment.email || !environment.password)
    throw new Error(
      "Set TEST_USER_EMAIL and TEST_USER_PASSWORD for a dedicated staging customer in ecommerce-automation/.env before running @customer tests.",
    );
  return { email: environment.email, password: environment.password };
};

export const requireCoupon = () => {
  const { couponCode, couponExpectedDiscount } = environment;
  if (!/^[A-Z0-9_-]{1,40}$/.test(couponCode))
    throw new Error("Set TEST_COUPON_CODE to an active coupon eligible for TEST_PRODUCT_SLUG and the dedicated customer in ecommerce-automation/.env.");
  if (!/^\d+(?:\.\d{1,2})?$/.test(couponExpectedDiscount) ||
      !Number.isFinite(Number(couponExpectedDiscount)) || Number(couponExpectedDiscount) <= 0)
    throw new Error("Set TEST_COUPON_EXPECTED_DISCOUNT to the expected BDT discount for one selected SKU unit, e.g. 100 or 100.50.");
  return { code: couponCode, expectedDiscount: Number(couponExpectedDiscount) };
};
