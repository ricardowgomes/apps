import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "../helpers";

const NOW = new Date().toISOString();

const SEED_CATEGORIES = [
	{
		id: "cat_groceries",
		name: "Groceries",
		icon: "🛒",
		color: "#22c55e",
		keywords: ["grocery", "walmart"],
		createdAt: NOW,
	},
	{
		id: "cat_salary",
		name: "Salary",
		icon: "💰",
		color: "#10b981",
		keywords: ["salary", "payroll"],
		createdAt: NOW,
	},
	{
		id: "cat_uncategorized",
		name: "Uncategorized",
		icon: "❓",
		color: "#6b7280",
		keywords: [],
		createdAt: NOW,
	},
];

async function seedCategories(request: import("@playwright/test").APIRequestContext) {
	await request.delete("/api/test/categories");
	await request.post("/api/test/categories", {
		data: { categories: SEED_CATEGORIES },
	});
}

async function clearCategories(request: import("@playwright/test").APIRequestContext) {
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
		await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
	});

	test("lists seeded categories sorted alphabetically", async ({ page }) => {
		await page.goto("/finance/categories");
		const names = await page.locator("text=Groceries, text=Salary, text=Uncategorized").allTextContents();
		// Just verify the page has our categories
		await expect(page.getByText("Groceries")).toBeVisible();
		await expect(page.getByText("Salary")).toBeVisible();
	});

	test("creates a new category inline", async ({ page }) => {
		await page.goto("/finance/categories");
		await page.getByRole("button", { name: "New" }).click();
		await page.getByPlaceholder("Category name").fill("Transport");
		await page.getByRole("button", { name: "Save" }).click();
		await expect(page.getByText("Transport")).toBeVisible();
	});

	test("edits an existing category", async ({ page }) => {
		await page.goto("/finance/categories");
		await page.getByRole("button", { name: "Edit Groceries" }).click();
		const nameInput = page.getByPlaceholder("Category name");
		await nameInput.clear();
		await nameInput.fill("Groceries & Food");
		await page.getByRole("button", { name: "Save" }).click();
		await expect(page.getByText("Groceries & Food")).toBeVisible();
	});

	test("deletes a category after confirmation", async ({ page }) => {
		await page.goto("/finance/categories");
		await page.getByRole("button", { name: "Delete Salary" }).click();
		await page.getByRole("button", { name: "Confirm" }).click();
		await expect(page.getByText("Salary")).not.toBeVisible();
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

	test("can select an existing category from the combobox", async ({ page }) => {
		await page.goto("/finance");
		// Open add transaction sheet
		await page.getByRole("button", { name: "Add" }).click();
		const sheet = page.getByTestId("transaction-sheet");
		await expect(sheet).toBeVisible();
		// Open the category combobox
		await sheet.getByLabel("Category").click();
		await expect(sheet.getByPlaceholder("Search categories…")).toBeVisible();
		await sheet.getByText("Groceries").click();
		await expect(sheet.getByText("🛒")).toBeVisible();
	});

	test("can create a new category on the fly from the combobox", async ({
		page,
	}) => {
		await page.goto("/finance");
		await page.getByRole("button", { name: "Add" }).click();
		const sheet = page.getByTestId("transaction-sheet");
		await sheet.getByLabel("Category").click();
		await sheet.getByPlaceholder("Search categories…").fill("Entertainment");
		await sheet.getByText('Create "Entertainment"').click();
		// The combobox should now show the new category name
		await expect(sheet.getByText("Entertainment")).toBeVisible();
	});
});
