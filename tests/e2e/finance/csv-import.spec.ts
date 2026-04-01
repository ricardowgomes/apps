import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "../helpers";

// ---------------------------------------------------------------------------
// CSV fixtures — minimal but structurally valid Wealthsimple exports
// ---------------------------------------------------------------------------

// Use today's date so imported rows appear in the default month view
const TODAY = new Date().toISOString().split("T")[0];

const ACCOUNT_CSV = [
	`"date","transaction","description","amount","balance","currency"`,
	`"${TODAY}","AFT_IN","E2E Direct Deposit","1200.00","5000.00","CAD"`,
	`"${TODAY}","SPEND","E2E Grocery Purchase","-85.50","4914.50","CAD"`,
].join("\n");

const CREDIT_CSV = [
	`"transaction_date","post_date","type","details","amount","currency"`,
	`"${TODAY}","${TODAY}","Purchase","E2E Coffee Shop","6.75","CAD"`,
	`"${TODAY}","${TODAY}","Payment","From chequing account","-500.00","CAD"`,
].join("\n");

const UNKNOWN_CSV = `"col1","col2","col3"\n"a","b","c"`;

function csvBuffer(content: string) {
	return {
		name: "statement.csv",
		mimeType: "text/csv" as const,
		buffer: Buffer.from(content),
	};
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function resetTransactions(
	request: Parameters<typeof loginAsTestUser>[0]["request"],
): Promise<void> {
	const res = await request.delete("/api/test/finance");
	if (!res.ok()) throw new Error(`Reset failed: ${res.status()}`);
}

async function openImportSheet(page: Parameters<typeof loginAsTestUser>[0]) {
	await page.getByTestId("open-import").click();
	const sheet = page.getByTestId("import-sheet");
	await expect(sheet).toBeVisible();
	return sheet;
}

async function uploadCSV(
	page: Parameters<typeof loginAsTestUser>[0],
	content: string,
) {
	// The file input is hidden — set files directly without clicking
	await page.locator('input[type="file"]').setInputFiles(csvBuffer(content));
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe("Finance — CSV Import", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeEach(async ({ page, request }) => {
		await resetTransactions(request);
		await loginAsTestUser(page);
		await page.goto("/finance");
	});

	test.afterEach(async ({ request }) => {
		await resetTransactions(request);
	});

	// ---- 1. Import button opens the sheet ------------------------------------

	test("Import button opens the import sheet", async ({ page }) => {
		const sheet = await openImportSheet(page);
		await expect(
			sheet.getByRole("heading", { name: "Import Transactions" }),
		).toBeVisible();
		await expect(sheet.getByText("Wealthsimple CSV export")).toBeVisible();
	});

	// ---- 2. Unknown CSV shows an error ---------------------------------------

	test("unknown CSV format shows an error message", async ({ page }) => {
		await openImportSheet(page);
		await uploadCSV(page, UNKNOWN_CSV);

		await expect(
			page.getByText("Could not detect a supported Wealthsimple CSV format"),
		).toBeVisible();
	});

	// ---- 3. Account CSV → preview shows parsed rows -------------------------

	test("account CSV shows preview with correct row count and transaction types", async ({
		page,
	}) => {
		await openImportSheet(page);
		await uploadCSV(page, ACCOUNT_CSV);

		// Should advance to preview step
		await expect(page.getByText("2 transactions found")).toBeVisible();
		await expect(page.getByText("E2E Direct Deposit")).toBeVisible();
		await expect(page.getByText("E2E Grocery Purchase")).toBeVisible();

		// Income row has + prefix, expense row has - prefix
		await expect(page.getByText("+$1,200.00")).toBeVisible();
		await expect(page.getByText("-$85.50")).toBeVisible();
	});

	// ---- 4. Credit card CSV → payments skipped ------------------------------

	test("credit card CSV skips payment rows and shows only purchases", async ({
		page,
	}) => {
		await openImportSheet(page);
		await uploadCSV(page, CREDIT_CSV);

		// 1 purchase found, 1 payment skipped
		await expect(page.getByText("1 transaction found")).toBeVisible();
		await expect(page.getByText("1 skipped")).toBeVisible();
		await expect(page.getByText("E2E Coffee Shop")).toBeVisible();
		// Payment description should not appear
		await expect(
			page.getByText("From chequing account"),
		).not.toBeVisible();
	});

	// ---- 5. Confirm import — rows appear in the transaction list ------------

	test("confirming import inserts transactions and they appear in the list", async ({
		page,
	}) => {
		await openImportSheet(page);
		await uploadCSV(page, ACCOUNT_CSV);
		await expect(page.getByText("2 transactions found")).toBeVisible();

		// Confirm
		await page.getByRole("button", { name: /Import 2/ }).click();

		// Done step
		await expect(page.getByText("Import complete")).toBeVisible();
		await expect(page.getByText("2 transactions imported")).toBeVisible();

		// Close sheet
		await page.getByRole("button", { name: "Done" }).click();
		await expect(page.getByTestId("import-sheet")).not.toBeVisible();

		// Transactions appear in the list
		await expect(page.getByText("E2E Direct Deposit")).toBeVisible();
		await expect(page.getByText("E2E Grocery Purchase")).toBeVisible();
	});

	// ---- 6. Duplicate detection — re-import skips existing rows -------------

	test("re-importing the same file reports duplicates and inserts nothing new", async ({
		page,
	}) => {
		// First import
		await openImportSheet(page);
		await uploadCSV(page, ACCOUNT_CSV);
		await page.getByRole("button", { name: /Import 2/ }).click();
		await expect(page.getByText("2 transactions imported")).toBeVisible();
		await page.getByRole("button", { name: "Done" }).click();

		// Second import — same file
		await openImportSheet(page);
		await uploadCSV(page, ACCOUNT_CSV);
		await page.getByRole("button", { name: /Import 2/ }).click();

		// Done step should show 0 inserted and 2 duplicates
		await expect(page.getByText("0 transactions imported")).toBeVisible();
		await expect(page.getByText("2 duplicates skipped")).toBeVisible();
	});

	// ---- 7. "Change file" goes back to upload step --------------------------

	test("Change file link returns to the upload step", async ({ page }) => {
		await openImportSheet(page);
		await uploadCSV(page, ACCOUNT_CSV);
		await expect(page.getByText("2 transactions found")).toBeVisible();

		await page.getByRole("button", { name: "Change file" }).click();

		// Back on upload step
		await expect(
			page.getByText("Drop your CSV here or click to browse"),
		).toBeVisible();
	});

	// ---- 8. Escape key closes the sheet -------------------------------------

	test("pressing Escape closes the import sheet", async ({ page }) => {
		await openImportSheet(page);
		await page.keyboard.press("Escape");
		await expect(page.getByTestId("import-sheet")).not.toBeVisible();
	});
});
