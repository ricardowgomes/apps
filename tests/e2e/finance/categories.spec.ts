import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "../helpers";

const NOW = new Date().toISOString();

const SEED_CATEGORIES = [
	{
		id: "cat_test_groceries",
		name: "Groceries",
		icon: "🛒",
		color: "#22c55e",
		keywords: ["grocery", "walmart"],
		createdAt: NOW,
	},
	{
		id: "cat_test_salary",
		name: "Salary",
		icon: "💰",
		color: "#10b981",
		keywords: ["salary", "payroll"],
		createdAt: NOW,
	},
	{
		id: "cat_test_uncategorized",
		name: "Uncategorized",
		icon: "❓",
		color: "#6b7280",
		keywords: [],
		createdAt: NOW,
	},
];

async function seedCategories(
	request: import("@playwright/test").APIRequestContext,
) {
	await request.delete("/api/test/categories");
	await request.post("/api/test/categories", {
		data: { categories: SEED_CATEGORIES },
	});
}

async function clearCategories(
	request: import("@playwright/test").APIRequestContext,
) {
	await request.delete("/api/test/categories");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Categories page", () => {
	test.beforeEach(async ({ page, request }) => {
		await loginAsTestUser(page);
		await seedCategories(request);
	});

	test.afterEach(async ({ request }) => {
		await clearCategories(request);
	});

	test("navigates to /finance/categories from BottomNav", async ({ page }) => {
		await page.goto("/finance");
		await page.getByRole("link", { name: /categories/i }).click();
		await expect(page).toHaveURL("/finance/categories");
		await expect(
			page.getByRole("heading", { name: "Categories" }),
		).toBeVisible();
	});

	test("lists seeded categories", async ({ page }) => {
		await page.goto("/finance/categories");
		// Use a heading-level selector to avoid matching keywords text
		await expect(page.getByText("Groceries", { exact: true }).first()).toBeVisible();
		await expect(page.getByText("Salary", { exact: true }).first()).toBeVisible();
	});

	test("creates a new category inline", async ({ page }) => {
		await page.goto("/finance/categories");
		await page.waitForLoadState("networkidle");
		await page.getByRole("button", { name: "New" }).click();
		await page.getByPlaceholder("Category name").fill("Transport");
		await page.getByRole("button", { name: "Save" }).click();
		await expect(page.getByText("Transport", { exact: true }).first()).toBeVisible();
	});

	test("edits an existing category", async ({ page }) => {
		await page.goto("/finance/categories");
		// Wait for categories to be fully rendered before interacting
		const editBtn = page.getByRole("button", { name: "Edit Groceries" });
		await expect(editBtn).toBeVisible();
		await editBtn.click();
		// Wait for the inline edit form to appear
		await expect(page.getByPlaceholder("Category name")).toBeVisible();
		const nameInput = page.getByPlaceholder("Category name");
		await nameInput.clear();
		await nameInput.fill("Groceries & Food");
		await page.getByRole("button", { name: "Save" }).click();
		await expect(
			page.getByText("Groceries & Food", { exact: true }).first(),
		).toBeVisible();
	});

	test("deletes a category after confirmation", async ({ page }) => {
		await page.goto("/finance/categories");
		// Wait for categories to be fully rendered; avoid networkidle (Vite HMR keeps sockets open)
		await expect(
			page.getByRole("button", { name: "Delete Salary" }),
		).toBeVisible();
		await page.getByRole("button", { name: "Delete Salary" }).click();
		await page.getByRole("button", { name: "Confirm" }).click();
		// After deletion, "Salary" text should no longer appear as a category name
		await expect(
			page.getByRole("button", { name: "Edit Salary" }),
		).not.toBeVisible();
	});
});

test.describe("CategoryCombobox — add transaction", () => {
	test.beforeEach(async ({ page, request }) => {
		await loginAsTestUser(page);
		await seedCategories(request);
	});

	test.afterEach(async ({ request }) => {
		await clearCategories(request);
	});

	test("can select an existing category from the combobox", async ({
		page,
	}) => {
		await page.goto("/finance");
		await page.waitForLoadState("networkidle");
		// Use the header button (testid) to avoid BottomNav button ambiguity
		await page.getByTestId("open-add-transaction").click();
		const sheet = page.getByTestId("transaction-sheet");
		await expect(sheet).not.toHaveAttribute("aria-hidden");
		// Open the category combobox (dropdown is portalled to document.body)
		await sheet.getByLabel("Category").click();
		await expect(page.getByPlaceholder("Search categories…")).toBeVisible();
		await page.getByPlaceholder("Search categories…").fill("Grocer");
		await page.getByRole("button", { name: /Groceries/ }).first().click();
		// The combobox trigger should now show the selected category icon
		await expect(sheet.getByText("🛒")).toBeVisible();
	});

	test("can create a new category on the fly from the combobox", async ({
		page,
	}) => {
		await page.goto("/finance");
		await page.waitForLoadState("networkidle");
		await page.getByTestId("open-add-transaction").click();
		const sheet = page.getByTestId("transaction-sheet");
		// Dropdown is portalled to document.body — use page-level locators
		await sheet.getByLabel("Category").click();
		await page.getByPlaceholder("Search categories…").fill("Entertainment");
		await page.getByText('Create "Entertainment"').click();
		// Combobox trigger should now show the new category name
		await expect(sheet.getByText("Entertainment")).toBeVisible();
	});
});
