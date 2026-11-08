import { test, expect } from "../fixtures/storefront.fixture";

test.describe("Product Details", { tag: ["@regression", "@ui", "@functional"] }, () => {
  test("TC-12 | Product details show the selected image, price, stock and purchase actions", async ({ product, testProduct }) => {
    await product.open(testProduct);
    await product.expectImageLoaded(product.imageButton.locator("img"));
    expect(await product.selectedPrice()).toBeGreaterThan(0);
    await expect(product.panel.getByRole("status")).toHaveText(/\d+ In Stock/);
    await expect(product.quantity).toHaveValue("1");
    await expect(product.panel.getByRole("button", { name: "Buy now", exact: true })).toBeEnabled();
    await expect(product.panel.getByRole("heading", { name: "Specifications", exact: true })).toBeVisible();
  });

  test("TC-13 | Selecting an available attribute updates the selected variant and cart SKU", async ({ product, variantProduct, cart, page }) => {
    await product.open(variantProduct);
    await product.addToBag();
    let changed = false;
    for (const group of await product.variantGroups.all()) {
      const candidates = group.getByRole("radio").and(page.locator(":not(:disabled):not(:checked)"));
      if (!await candidates.count()) continue;
      const name = await candidates.first().getAttribute("value");
      if (!name) throw new Error("The available attribute option must have a value.");
      const radio = group.getByRole("radio", { name, exact: true });
      await product.chooseOption(radio);
      await product.addToBag();
      await cart.open();
      await expect(cart.rows).toHaveCount(2);
      const removeActions = await cart.rows.getByRole("button", { name: /^Remove / }).all();
      const skus = await Promise.all(removeActions.map((button) => button.getAttribute("aria-label")));
      expect(new Set(skus).size).toBe(2);
      if (name) await expect(cart.rows.last()).toContainText(name);
      changed = true;
      break;
    }
    expect(changed, "The test product must expose at least one alternate available attribute").toBe(true);
  });

  test("TC-14 | Image preview supports zoom in, zoom out, reset and close on mobile", async ({ page, product, testProduct }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await product.open(testProduct);
    await product.imageButton.click();
    const modal = product.preview;
    await expect(modal).toBeVisible();
    const level = modal.getByLabel("Zoom Level", { exact: true });
    await expect(level).toHaveText("100%");
    await expect(modal.getByRole("button", { name: "Zoom Out", exact: true })).toBeDisabled();
    await modal.getByRole("button", { name: "Zoom In", exact: true }).click();
    await expect(level).toHaveText("150%");
    await modal.getByRole("button", { name: "Zoom Out", exact: true }).click();
    await expect(level).toHaveText("100%");
    await modal.getByRole("button", { name: "Zoom In", exact: true }).click();
    await modal.getByRole("button", { name: "Reset Zoom", exact: true }).click();
    await expect(level).toHaveText("100%");
    await product.expectNoHorizontalOverflow();
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
});
