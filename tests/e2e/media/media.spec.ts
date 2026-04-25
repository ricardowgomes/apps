import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAsTestUser } from "../helpers";

// ── Seed helpers ──────────────────────────────────────────────────────────────

async function seedMediaItem(
	request: Page["request"],
	data: {
		type: "movie" | "tv_show" | "music";
		title: string;
		year?: number;
		genres?: string[];
		directors?: string[];
		artists?: string[];
		status?: "backlog" | "in_progress" | "done";
	},
): Promise<string> {
	const res = await request.post("/api/test/media", { data });
	if (!res.ok()) throw new Error(`Seed failed: ${res.status()}`);
	const { id } = (await res.json()) as { id: string };
	return id;
}

async function resetMedia(request: Page["request"]): Promise<void> {
	const res = await request.delete("/api/test/media");
	if (!res.ok()) throw new Error(`Reset failed: ${res.status()}`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Media Archive", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsTestUser(page);
		await resetMedia(page.request);
	});

	test.afterEach(async ({ page }) => {
		await resetMedia(page.request);
	});

	test("redirects to /login when not authenticated", async ({ page }) => {
		await page.context().clearCookies();
		await page.goto("/media/");
		await expect(page).toHaveURL(/\/login/);
	});

	test("shows empty state when there are no items", async ({ page }) => {
		await page.goto("/media/");
		await expect(
			page.getByText("Nothing here yet"),
		).toBeVisible();
	});

	test("adds a movie and it appears in the archive", async ({ page }) => {
		await page.goto("/media/");

		// Open the add sheet
		await page.getByTestId("add-media-button").click();
		await expect(page.getByTestId("media-sheet")).toBeVisible();

		// Fill in the title — use exact match to avoid matching the search bar placeholder
		await page.getByPlaceholder("Title", { exact: true }).fill("Inception");

		// Submit
		await page.getByRole("button", { name: "Add to Archive" }).click();

		// Card should appear
		await expect(page.getByText("Inception")).toBeVisible();
	});

	test("adds a music album and it appears in the archive", async ({ page }) => {
		await page.goto("/media/");

		await page.getByTestId("add-media-button").click();
		await expect(page.getByTestId("media-sheet")).toBeVisible();

		// Switch to Music type
		await page.getByRole("button", { name: "Music" }).click();

		// Fill title
		await page.getByPlaceholder("Album or song title").fill("OK Computer");

		// Submit
		await page.getByRole("button", { name: "Add to Archive" }).click();

		await expect(page.getByText("OK Computer")).toBeVisible();
	});

	test("filters archive by type", async ({ page }) => {
		await seedMediaItem(page.request, {
			type: "movie",
			title: "The Matrix",
		});
		await seedMediaItem(page.request, {
			type: "music",
			title: "Dark Side of the Moon",
		});

		await page.goto("/media/");

		// Both items visible initially
		await expect(page.getByText("The Matrix")).toBeVisible();
		await expect(page.getByText("Dark Side of the Moon")).toBeVisible();

		// Open filters and pick Movie — scope to filter panel to avoid matching
		// the type selector inside the always-rendered AddMediaSheet
		await page.getByRole("button", { name: "Filters" }).click();
		await page
			.getByTestId("media-filters")
			.getByRole("button", { name: "Movie" })
			.click();

		// Only the movie should be visible
		await expect(page.getByText("The Matrix")).toBeVisible();
		await expect(page.getByText("Dark Side of the Moon")).not.toBeVisible();
	});

	test("searches archive by title", async ({ page }) => {
		await seedMediaItem(page.request, {
			type: "movie",
			title: "Interstellar",
		});
		await seedMediaItem(page.request, {
			type: "tv_show",
			title: "Breaking Bad",
		});

		await page.goto("/media/");

		await page.getByTestId("media-search").fill("Interstellar");

		await expect(page.getByText("Interstellar")).toBeVisible();
		await expect(page.getByText("Breaking Bad")).not.toBeVisible();
	});

	test("connections: clicking a genre tag filters the archive", async ({
		page,
	}) => {
		await seedMediaItem(page.request, {
			type: "movie",
			title: "Blade Runner",
			genres: ["Sci-Fi"],
		});
		await seedMediaItem(page.request, {
			type: "movie",
			title: "The Godfather",
			genres: ["Drama"],
		});

		await page.goto("/media/");

		// Both items visible
		await expect(page.getByText("Blade Runner")).toBeVisible();
		await expect(page.getByText("The Godfather")).toBeVisible();

		// Click the "Sci-Fi" tag on the Blade Runner card
		await page.getByRole("button", { name: "Sci-Fi" }).first().click();

		// Connection filter is active — only Blade Runner should show
		await expect(page.getByText("Blade Runner")).toBeVisible();
		await expect(page.getByText("The Godfather")).not.toBeVisible();

		// Banner shows the active connection
		await expect(page.getByText("Sci-Fi")).toBeVisible();
	});

	test("deletes an item from the archive", async ({ page }) => {
		await seedMediaItem(page.request, {
			type: "music",
			title: "Rumours",
		});

		await page.goto("/media/");
		await expect(page.getByText("Rumours")).toBeVisible();

		// Hover to reveal the delete button
		const card = page.locator('[aria-label="Edit Rumours"]');
		await card.hover();
		await page.getByRole("button", { name: "Delete Rumours" }).click();

		await expect(page.getByText("Rumours")).not.toBeVisible();
	});
});
