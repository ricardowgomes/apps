import { expect, test } from "@playwright/test";

test("redirects unauthenticated users from /finance to /login", async ({
	page,
}) => {
	await page.context().clearCookies();
	await page.goto("/finance");
	await expect(page).toHaveURL(/\/login/);
});

test("shows the Sign in with Google button on the login page", async ({
	page,
}) => {
	await page.goto("/login");
	await expect(page.getByRole("link", { name: /Sign in with Google/i })).toBeVisible();
});
