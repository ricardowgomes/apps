import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAsTestUser } from "../helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Use today so that seeded transactions appear in the default month view
const TODAY = new Date().toISOString().split("T")[0];

// A date in the previous calendar month (for month-picker tests)
function previousMonthDate(): string {
	const d = new Date();
	d.setDate(1);
	d.setMonth(d.getMonth() - 1);
	return d.toISOString().split("T")[0];
}

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
		date: TODAY,
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
	// Run sequentially — tests share a single local D1 DB, and concurrent
	// beforeEach resets can race with each other and cross-contaminate data.
	test.describe.configure({ mode: "serial" });

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

		// Open the sheet via testid to avoid BottomNav / sheet button ambiguity
		await page.getByTestId("open-add-transaction").click();
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

		await page.getByTestId("open-add-transaction").click();
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

	// ---- 5. Edit transaction -------------------------------------------------

	test("edit transaction — updated values appear in the list", async ({
		page,
		request,
	}) => {
		await seedTransactions(request, [
			makeTransaction({
				id: "test-edit-1",
				type: "expense",
				amount: 100,
				category: "Food & Dining",
				description: "Original Description",
				date: TODAY,
			}),
		]);

		await page.goto("/finance");
		await expect(page.getByText("Original Description")).toBeVisible();

		// Click the edit button on the row
		await page.getByRole("button", { name: "Edit transaction" }).first().click();

		const sheet = page.getByRole("dialog", { name: "Edit transaction" });
		await expect(sheet).toBeVisible();
		await expect(sheet.getByRole("heading", { name: "Edit Transaction" })).toBeVisible();

		// Update description and amount
		await sheet.getByLabel("Description").fill("Updated Description");
		await sheet.getByLabel("Amount (CAD)").fill("250");

		await sheet.getByRole("button", { name: "Save Changes" }).click();

		// Sheet should close and updated row should be visible
		await expect(sheet).not.toBeVisible();
		await expect(page.getByText("Updated Description")).toBeVisible();
		await expect(page.getByText("Original Description")).not.toBeVisible();
	});

	// ---- 6. Filter: income ---------------------------------------------------

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

		// Apply income filter — scope to main to avoid sheet type-toggle ambiguity
		await page
			.getByRole("main")
			.getByRole("button", { name: "Income", exact: true })
			.click();

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

		// Confirm both rows loaded before filtering
		await expect(page.getByText("Expense Filter Expense Row")).toBeVisible();
		await expect(page.getByText("Expense Filter Income Row")).toBeVisible();

		// Apply expense filter — scope to main to avoid sheet type-toggle ambiguity
		await page
			.getByRole("main")
			.getByRole("button", { name: "Expenses", exact: true })
			.click();

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

	// ---- 9. Month picker — navigation hides other months --------------------

	test("month picker — previous month shows only that month's transactions", async ({
		page,
		request,
	}) => {
		const prevDate = previousMonthDate();

		await seedTransactions(request, [
			makeTransaction({
				id: "test-month-current",
				type: "income",
				description: "Current Month Transaction",
				date: TODAY,
			}),
			makeTransaction({
				id: "test-month-prev",
				type: "expense",
				description: "Previous Month Transaction",
				date: prevDate,
			}),
		]);

		await page.goto("/finance");

		// Default: current month — only current transaction visible
		await expect(page.getByText("Current Month Transaction")).toBeVisible();
		await expect(page.getByText("Previous Month Transaction")).not.toBeVisible();

		// Navigate to previous month
		await page.getByRole("button", { name: "Previous month" }).click();

		// Now only previous month transaction is visible
		await expect(page.getByText("Previous Month Transaction")).toBeVisible();
		await expect(page.getByText("Current Month Transaction")).not.toBeVisible();

		// Navigate back to current month
		await page.getByRole("button", { name: "Next month" }).click();

		await expect(page.getByText("Current Month Transaction")).toBeVisible();
		await expect(page.getByText("Previous Month Transaction")).not.toBeVisible();
	});

	// ---- 10. Month picker — summary cards update with selected month --------

	test("month picker — summary cards reflect selected month's totals", async ({
		page,
		request,
	}) => {
		const prevDate = previousMonthDate();

		await seedTransactions(request, [
			makeTransaction({
				id: "test-month-summary-current",
				type: "income",
				amount: 1000,
				description: "Current Month Income",
				date: TODAY,
			}),
			makeTransaction({
				id: "test-month-summary-prev",
				type: "income",
				amount: 500,
				description: "Previous Month Income",
				date: prevDate,
			}),
		]);

		await page.goto("/finance");

		// Current month: $1,000 income
		await expect(page.getByTestId("income-card")).toContainText("$1,000.00");

		// Navigate to previous month: $500 income
		await page.getByRole("button", { name: "Previous month" }).click();
		await expect(page.getByTestId("income-card")).toContainText("$500.00");
	});

	// ---- 11. Sort order toggle -----------------------------------------------

	test("sort order toggle — switches between newest-first and oldest-first", async ({
		page,
		request,
	}) => {
		// Seed two transactions with different dates in the current month
		const d = new Date();
		const firstOfMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
		const lastOfMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-28`;

		await seedTransactions(request, [
			makeTransaction({
				id: "test-sort-early",
				type: "income",
				description: "Early Transaction",
				date: firstOfMonth,
			}),
			makeTransaction({
				id: "test-sort-late",
				type: "expense",
				description: "Late Transaction",
				date: lastOfMonth,
			}),
		]);

		await page.goto("/finance");

		// Default: newest first — Late Transaction should appear before Early Transaction
		const rows = page.getByRole("main");
		const lateIndex = await rows
			.getByText("Late Transaction")
			.evaluate((el) => el.getBoundingClientRect().top);
		const earlyIndex = await rows
			.getByText("Early Transaction")
			.evaluate((el) => el.getBoundingClientRect().top);
		expect(lateIndex).toBeLessThan(earlyIndex);

		// Toggle to oldest first
		await page.getByTestId("sort-toggle").click();

		// Now Early Transaction should appear before Late Transaction
		const lateAfter = await rows
			.getByText("Late Transaction")
			.evaluate((el) => el.getBoundingClientRect().top);
		const earlyAfter = await rows
			.getByText("Early Transaction")
			.evaluate((el) => el.getBoundingClientRect().top);
		expect(earlyAfter).toBeLessThan(lateAfter);
	});

	// ---- 12. Category breakdown chart ----------------------------------------

	test("category breakdown chart appears with expense data", async ({
		page,
		request,
	}) => {
		await seedTransactions(request, [
			makeTransaction({
				id: "test-chart-expense-1",
				type: "expense",
				amount: 120,
				category: "Food & Dining",
				description: "Chart Expense Food",
			}),
			makeTransaction({
				id: "test-chart-expense-2",
				type: "expense",
				amount: 60,
				category: "Transport",
				description: "Chart Expense Transport",
			}),
		]);

		await page.goto("/finance");

		const chart = page.getByTestId("category-breakdown-chart");
		await expect(chart).toBeVisible();

		// Category labels should appear in the chart
		await expect(chart.getByText("Food & Dining")).toBeVisible();
		await expect(chart.getByText("Transport")).toBeVisible();
	});

	test("category breakdown chart shows empty state when no expenses", async ({
		page,
		request,
	}) => {
		await seedTransactions(request, [
			makeTransaction({
				id: "test-chart-income-only",
				type: "income",
				amount: 3000,
				description: "Chart Income Only",
			}),
		]);

		await page.goto("/finance");

		const chart = page.getByTestId("category-breakdown-chart");
		await expect(chart).toBeVisible();
		await expect(chart.getByText("No expenses this month")).toBeVisible();
	});

	// ---- 13. Monthly trend chart ---------------------------------------------

	test("monthly trend chart is visible on the finance page", async ({
		page,
	}) => {
		await page.goto("/finance");

		const chart = page.getByTestId("monthly-trend-chart");
		await expect(chart).toBeVisible();
		await expect(
			chart.getByText("Income vs Expenses — Last 6 Months"),
		).toBeVisible();
	});
});
