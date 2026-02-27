import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAsTestUser } from "../helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TEST_DATE = "2024-06-15";

type SeedTransaction = {
	id: string;
	type: "income" | "expense";
	amount: number;
	currency: string;
	category: string;
	description: string;
	date: string;
	createdAt: string;
};

function makeTransaction(
	overrides: Partial<SeedTransaction> & Pick<SeedTransaction, "id" | "type">,
): SeedTransaction {
	return {
		amount: 100,
		currency: "CAD",
		category: overrides.type === "income" ? "Salary" : "Food & Dining",
		description:
			overrides.type === "income" ? "Test Income Entry" : "Test Expense Entry",
		date: TEST_DATE,
		createdAt: new Date().toISOString(),
		...overrides,
	};
}

async function seedTransactions(
	request: Page["request"],
	transactions: SeedTransaction[],
): Promise<void> {
	const res = await request.post("/api/test/finance", {
		data: { transactions },
	});
	if (!res.ok()) throw new Error(`Seed failed: ${res.status()}`);
}

async function resetTransactions(request: Page["request"]): Promise<void> {
	const res = await request.delete("/api/test/finance");
	if (!res.ok()) throw new Error(`Reset failed: ${res.status()}`);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe("Finance", () => {
	test.beforeEach(async ({ page, request }) => {
		// Ensure a clean DB before every test, then authenticate.
		await resetTransactions(request);
		await loginAsTestUser(page);
	});

	test.afterEach(async ({ request }) => {
		await resetTransactions(request);
	});

	// ---- 1. Page loads -------------------------------------------------------

	test("finance page loads with heading and summary cards", async ({ page }) => {
		await page.goto("/finance");

		await expect(
			page.getByRole("heading", { name: "Transactions" }),
		).toBeVisible();
		await expect(page.getByTestId("balance-card")).toBeVisible();
		await expect(page.getByTestId("income-card")).toBeVisible();
		await expect(page.getByTestId("expenses-card")).toBeVisible();
	});

	// ---- 2. Add income -------------------------------------------------------

	test("add income transaction — row appears and income card updates", async ({
		page,
	}) => {
		await page.goto("/finance");

		// Open the sheet
		await page.getByRole("button", { name: "Add" }).click();
		const sheet = page.getByRole("dialog", { name: "Add transaction" });
		await expect(sheet).toBeVisible();

		// Switch to income
		await sheet.getByRole("button", { name: "income" }).click();

		// Fill fields
		await sheet.getByLabel("Amount (CAD)").fill("1500");
		await sheet.getByLabel("Category").selectOption("Salary");
		await sheet.getByLabel("Description").fill("E2E Monthly Salary");

		// Submit
		await sheet.getByRole("button", { name: "Add Transaction" }).click();

		// Sheet should close and new row should be visible
		await expect(sheet).not.toBeVisible();
		await expect(page.getByText("E2E Monthly Salary")).toBeVisible();

		// Income card should reflect the new amount
		await expect(page.getByTestId("income-card")).toContainText("$1,500.00");
	});

	// ---- 3. Add expense ------------------------------------------------------

	test("add expense transaction — row appears and expenses card updates", async ({
		page,
	}) => {
		await page.goto("/finance");

		await page.getByRole("button", { name: "Add" }).click();
		const sheet = page.getByRole("dialog", { name: "Add transaction" });

		// expense is the default type — no need to switch
		await sheet.getByLabel("Amount (CAD)").fill("250");
		await sheet.getByLabel("Category").selectOption("Food & Dining");
		await sheet.getByLabel("Description").fill("E2E Grocery Run");

		await sheet.getByRole("button", { name: "Add Transaction" }).click();

		await expect(sheet).not.toBeVisible();
		await expect(page.getByText("E2E Grocery Run")).toBeVisible();

		await expect(page.getByTestId("expenses-card")).toContainText("$250.00");
	});

	// ---- 4. Delete transaction -----------------------------------------------

	test("delete transaction — row is removed from the list", async ({
		page,
		request,
	}) => {
		await seedTransactions(request, [
			makeTransaction({ id: "test-delete-1", type: "income" }),
		]);

		await page.goto("/finance");
		await expect(page.getByText("Test Income Entry")).toBeVisible();

		// Click the delete button on that row
		await page
			.getByRole("button", { name: "Delete transaction" })
			.first()
			.click();

		await expect(page.getByText("Test Income Entry")).not.toBeVisible();
	});

	// ---- 5. Filter: income ---------------------------------------------------

	test("filter by income — only income rows are visible", async ({
		page,
		request,
	}) => {
		await seedTransactions(request, [
			makeTransaction({
				id: "test-filter-income-1",
				type: "income",
				description: "Filter Income Row",
			}),
			makeTransaction({
				id: "test-filter-expense-1",
				type: "expense",
				description: "Filter Expense Row",
			}),
		]);

		await page.goto("/finance");

		// Both rows visible before filtering
		await expect(page.getByText("Filter Income Row")).toBeVisible();
		await expect(page.getByText("Filter Expense Row")).toBeVisible();

		// Apply income filter
		await page.getByRole("button", { name: "Income" }).click();

		await expect(page.getByText("Filter Income Row")).toBeVisible();
		await expect(page.getByText("Filter Expense Row")).not.toBeVisible();
	});

	// ---- 6. Filter: expense --------------------------------------------------

	test("filter by expense — only expense rows are visible", async ({
		page,
		request,
	}) => {
		await seedTransactions(request, [
			makeTransaction({
				id: "test-filter-income-2",
				type: "income",
				description: "Expense Filter Income Row",
			}),
			makeTransaction({
				id: "test-filter-expense-2",
				type: "expense",
				description: "Expense Filter Expense Row",
			}),
		]);

		await page.goto("/finance");

		await page.getByRole("button", { name: "Expenses" }).click();

		await expect(page.getByText("Expense Filter Expense Row")).toBeVisible();
		await expect(page.getByText("Expense Filter Income Row")).not.toBeVisible();
	});

	// ---- 7. Search -----------------------------------------------------------

	test("search by description — only matching rows are visible", async ({
		page,
		request,
	}) => {
		await seedTransactions(request, [
			makeTransaction({
				id: "test-search-1",
				type: "income",
				description: "Acme Corp Payroll",
			}),
			makeTransaction({
				id: "test-search-2",
				type: "expense",
				description: "Coffee Shop Purchase",
			}),
		]);

		await page.goto("/finance");

		await expect(page.getByText("Acme Corp Payroll")).toBeVisible();
		await expect(page.getByText("Coffee Shop Purchase")).toBeVisible();

		await page
			.getByPlaceholder("Search transactions\u2026")
			.fill("Acme Corp");

		await expect(page.getByText("Acme Corp Payroll")).toBeVisible();
		await expect(page.getByText("Coffee Shop Purchase")).not.toBeVisible();
	});

	// ---- 8. Summary cards match transaction sums -----------------------------

	test("summary cards reflect seeded income, expenses, and balance", async ({
		page,
		request,
	}) => {
		await seedTransactions(request, [
			makeTransaction({
				id: "test-summary-income",
				type: "income",
				amount: 2000,
				description: "Summary Income",
			}),
			makeTransaction({
				id: "test-summary-expense",
				type: "expense",
				amount: 500,
				description: "Summary Expense",
			}),
		]);

		await page.goto("/finance");

		await expect(page.getByTestId("income-card")).toContainText("$2,000.00");
		await expect(page.getByTestId("expenses-card")).toContainText("$500.00");
		await expect(page.getByTestId("balance-card")).toContainText("$1,500.00");
	});
});
