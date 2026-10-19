import { expect, test } from "@playwright/test";

test("anonymous portal: loading, customers, tabs, bulk actions, panels and settings", async ({ page }) => {
    const errors: string[] = [];
    const external: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => {
        if (!request.url().startsWith("http://127.0.0.1:5187/")) external.push(request.url());
    });
    const started = Date.now();
    await page.goto("/");
    await expect(page.getByText("Loading Fluent demo...")).toBeVisible();
    await expect(page.getByRole("progressbar")).toBeVisible();
    await expect(page.getByRole("tab", { name: /Orders Pending/ })).toBeVisible({ timeout: 15000 });
    expect(Date.now() - started).toBeGreaterThanOrEqual(4900);
    await expect(page.getByRole("button", { name: "Fluent demo", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Redux learning guide" })).toHaveCount(0);
    await expect(page.getByRole("menuitem", { name: "Complete selected" })).toBeDisabled();

    await page.getByRole("button", { name: /Customers Filter/ }).click();
    const filter = page.getByRole("dialog");
    await filter.getByRole("switch", { name: "Filter customers" }).click();
    await filter.getByRole("searchbox", { name: "Search customers" }).fill("Cedar");
    await filter.getByRole("button", { name: "Select Cedar Crafts", exact: true }).click();
    await filter.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByText("2 requests shown / 0 selected")).toBeVisible();
    await page.getByRole("button", { name: "Open DEMO-101" }).click();
    const details = page.getByRole("dialog");
    await expect(details.getByText("Prepare a sketching kit", { exact: true })).toBeVisible();
    await details.getByRole("button", { name: "Close", exact: true }).click();

    await page.getByRole("checkbox", { name: "Select all requests" }).click();
    await page.getByRole("menuitem", { name: "Complete selected" }).click();
    await expect(page.getByText("2 request(s) completed.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "No requests here" })).toBeVisible();
    await page.getByRole("tab", { name: /Completed/ }).click();
    await expect(page.getByRole("button", { name: "Open DEMO-101" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open DEMO-104" })).toBeVisible();

    await page.getByRole("button", { name: /Customers Filter/ }).click();
    await page.getByRole("dialog").getByRole("switch", { name: "Filter customers" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("tab", { name: /Deliveries Pending/ }).click();
    await page.getByRole("checkbox", { name: "Select all requests" }).click();
    await page.getByRole("menuitem", { name: "Reject selected" }).click();
    await expect(page.getByText("2 request(s) rejected.")).toBeVisible();
    await page.getByRole("tab", { name: /Completed/ }).click();
    await page.getByRole("button", { name: "Open DEMO-103" }).click();
    await expect(page.getByRole("dialog").getByText("Rejected", { exact: true })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();

    await page.getByRole("button", { name: "User Profile Menu" }).click();
    await expect(page.getByRole("menuitemcheckbox", { name: "VNext Portal enabled" })).toBeChecked();
    await page.getByRole("menuitem", { name: "Customer settings" }).click();
    await expect(page.getByRole("heading", { name: "Customer Settings" })).toBeVisible();
    await page.getByRole("switch", { name: "Demo notifications" }).click();
    await page.getByRole("button", { name: "Save customer settings" }).click();
    await expect(page.getByText("Settings saved for Cedar Crafts. No real notifications are sent.")).toBeVisible();
    await page.reload();
    await page.getByRole("tab", { name: /Orders Pending/ }).waitFor({ timeout: 15000 });
    await page.getByRole("button", { name: "User Profile Menu" }).click();
    await page.getByRole("menuitem", { name: "Customer settings" }).click();
    await expect(page.getByRole("switch", { name: "Demo notifications" })).toBeChecked();
    await page.getByRole("button", { name: "User Profile Menu" }).click();
    await page.getByRole("menuitemcheckbox", { name: "VNext Portal enabled" }).click();
    await page.getByRole("button", { name: "User Profile Menu" }).click();
    await expect(page.getByRole("menuitemcheckbox", { name: "VNext Portal enabled" })).not.toBeChecked();
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Back to requests" }).click();

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("tab", { name: /Deliveries Pending/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
});

test("load failure is visible and Retry restores the portal", async ({ page }) => {
    await page.route("**/api/requests", route => route.fulfill({
        status: 503, contentType: "application/json", body: JSON.stringify({ error: "Demo server unavailable" })
    }));
    await page.goto("/");
    await expect(page.getByText("Demo server unavailable")).toBeVisible();
    await page.unroute("**/api/requests");
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.getByRole("tab", { name: /Orders Pending/ })).toBeVisible({ timeout: 15000 });
});
