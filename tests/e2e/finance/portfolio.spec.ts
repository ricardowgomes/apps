import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAsTestUser } from "../helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SeedEntry = {
	id: string;
	type: "investment" | "debt";
	name: string;
	monthly_amount: number | null;
	interest_rate: number | null;
	total_amount: number;
	currency: string;
	updatedAt: string;
	createdAt: string;
};

function makeEntry(
	overrides: Partial<SeedEntry> & Pick<SeedEntry, "id" | "type" | "name">,
): SeedEntry {
	const now = new Date().toISOString();
	return {
		monthly_amount: null,
		interest_rate: null,
		total_amount: 10000,
		currency: "CAD",
		updatedAt: now,
		createdAt: now,
		...overrides,
	};
}

async function seedEntries(
	request: Page["request"],
	entries: SeedEntry[],
): Promise<void> {
	const res = await request.post("/api/test/portfolio", {
		data: { entries },
	});
	if (!res.ok()) throw new Error(`Seed failed: ${res.status()}`);
}

async function resetEntries(request: Page["request"]): Promise<void> {
	const res = await request.delete("/api/test/portfolio");
	if (!res.ok()) throw new Error(`Reset failed: ${res.status()}`);
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe("Portfolio", () => {
	test.describe.configure({ mode: "serial" });

	test.beforeEach(async ({ page, request }) => {
		await resetEntries(request);
		await loginAsTestUser(page);
	});

	test.afterEach(async ({ request }) => {
		await resetEntries(request);
	});

	// ---- 1. Page loads -------------------------------------------------------

	test("portfolio page loads with heading and summary cards", async ({
		page,
	}) => {
		await page.goto("/finance/portfolio");
		await page.waitForLoadState("networkidle");

		await expect(
			page.getByRole("heading", { name: "Portfolio" }),
		).toBeVisible();
		await expect(page.getByTestId("net-worth-card")).toBeVisible();
		await expect(page.getByTestId("total-investments-card")).toBeVisible();
		await expect(page.getByTestId("total-debt-card")).toBeVisible();
	});

	// ---- 2. Add investment ---------------------------------------------------

	test("add investment entry — row appears and investments card updates", async ({
		page,
	}) => {
		await page.goto("/finance/portfolio");
		await page.waitForLoadState("networkidle");

		await page.getByTestId("open-add-entry").click();
		const sheet = page.getByTestId("portfolio-entry-sheet");
		await expect(sheet).not.toHaveAttribute("aria-hidden");

		// Investment is the default type
		await sheet.getByLabel("Name").fill("RRSP Manulife");
		await sheet.getByLabel(/Current Balance/).fill("45452.20");
		await sheet.getByLabel(/Monthly Contribution/).fill("325");
		await sheet.getByLabel(/Interest Rate/).fill("8.99");

		await sheet.getByRole("button", { name: "Add Entry" }).click();

		await expect(sheet).toHaveAttribute("aria-hidden", "true");
		await expect(page.getByText("RRSP Manulife")).toBeVisible();

		await expect(page.getByTestId("total-investments-card")).toContainText(
			"$45,452.20",
		);
	});

	// ---- 3. Add debt ---------------------------------------------------------

	test("add debt entry — row appears and debt card updates", async ({
		page,
	}) => {
		await page.goto("/finance/portfolio");
		await page.waitForLoadState("networkidle");

		await page.getByTestId("open-add-entry").click();
		const sheet = page.getByTestId("portfolio-entry-sheet");

		// Switch to debt
		await sheet.getByRole("button", { name: "debt" }).click();
		await sheet.getByLabel("Name").fill("Car Loan");
		await sheet.getByLabel(/Current Balance/).fill("20000");
		await sheet.getByLabel(/Monthly Contribution/).fill("650");
		await sheet.getByLabel(/Interest Rate/).fill("3.99");

		await sheet.getByRole("button", { name: "Add Entry" }).click();

		await expect(sheet).toHaveAttribute("aria-hidden", "true");
		await expect(page.getByText("Car Loan")).toBeVisible();

		await expect(page.getByTestId("total-debt-card")).toContainText("$20,000.00");
	});

	// ---- 4. Summary cards reflect seeded data --------------------------------

	test("summary cards reflect seeded investments and debts", async ({
		page,
		request,
	}) => {
		await seedEntries(request, [
			makeEntry({
				id: "seed-inv-1",
				type: "investment",
				name: "TFSA WealthSimple",
				total_amount: 12000,
			}),
			makeEntry({
				id: "seed-debt-1",
				type: "debt",
				name: "Mortgage",
				total_amount: 5000,
			}),
		]);

		await page.goto("/finance/portfolio");
		await page.waitForLoadState("networkidle");

		await expect(page.getByTestId("total-investments-card")).toContainText(
			"$12,000.00",
		);
		await expect(page.getByTestId("total-debt-card")).toContainText("$5,000.00");
		await expect(page.getByTestId("net-worth-card")).toContainText("$7,000.00");
	});

	// ---- 5. Edit entry -------------------------------------------------------

	test("edit entry — updated values appear in the list", async ({
		page,
		request,
	}) => {
		await seedEntries(request, [
			makeEntry({
				id: "seed-edit-1",
				type: "investment",
				name: "Original Name",
				total_amount: 10000,
			}),
		]);

		await page.goto("/finance/portfolio");
		await page.waitForLoadState("networkidle");
		await expect(page.getByText("Original Name")).toBeVisible();

		await page.getByTestId("edit-entry-btn").first().click();

		const sheet = page.getByTestId("portfolio-entry-sheet");
		await expect(sheet).not.toHaveAttribute("aria-hidden");

		await sheet.getByLabel("Name").fill("Updated Name");
		await sheet.getByLabel(/Current Balance/).fill("15000");

		await sheet.getByRole("button", { name: "Save Changes" }).click();

		await expect(sheet).toHaveAttribute("aria-hidden", "true");
		await expect(page.getByText("Updated Name")).toBeVisible();
		await expect(page.getByText("Original Name")).not.toBeVisible();
		await expect(page.getByTestId("total-investments-card")).toContainText(
			"$15,000.00",
		);
	});

	// ---- 6. Delete entry -----------------------------------------------------

	test("delete entry — row is removed from the list", async ({
		page,
		request,
	}) => {
		await seedEntries(request, [
			makeEntry({
				id: "seed-delete-1",
				type: "debt",
				name: "Delete Me Loan",
				total_amount: 5000,
			}),
		]);

		await page.goto("/finance/portfolio");
		await page.waitForLoadState("networkidle");
		await expect(page.getByText("Delete Me Loan")).toBeVisible();

		await page.getByTestId("delete-entry-btn").first().click();

		await expect(page.getByText("Delete Me Loan")).not.toBeVisible();
	});

	// ---- 7. Projection chart -------------------------------------------------

	test("projection chart is visible", async ({ page }) => {
		await page.goto("/finance/portfolio");
		await page.waitForLoadState("networkidle");

		await expect(page.getByTestId("projection-chart")).toBeVisible();
		await expect(
			page.getByText("5-Year Projection"),
		).toBeVisible();
	});

	// ---- 8. BottomNav has Portfolio link -------——-—---—---------------------

	test("bottom nav shows portfolio link", async ({ page }) => {
		await page.goto("/finance");
		await page.waitForLoadState("networkidle");

		const nav = page.getByRole("navigation");
		await expect(nav.getByRole("link", { name: /Portfolio/i })).toBeVisible();
	});
});
