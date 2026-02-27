import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "../helpers";

test("loginAsTestUser sets a valid session and /finance loads without redirect", async ({
	page,
}) => {
	await loginAsTestUser(page);
	await page.goto("/finance");
	await expect(page).not.toHaveURL(/\/login/);
	await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible();
});
