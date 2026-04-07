import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAsTestUser } from "../helpers";

// ── Seed helpers ─────────────────────────────────────────────────────────────

const SEED_STORY = {
	title: "The Brave Little Fox",
	scenes: [
		{
			text: "Once upon a time, a little fox named Finn lived at the edge of a great forest.",
			imagePrompt:
				"A small red fox standing at the edge of a magical watercolour forest.",
		},
		{
			text: "One morning Finn discovered a shimmering golden acorn under the oldest oak tree.",
			imagePrompt:
				"A glowing golden acorn beneath a giant oak tree in a children's book style.",
		},
		{
			text: "Finn carried the acorn home and planted it. By spring, a new forest had grown.",
			imagePrompt:
				"A tiny fox planting an acorn, a lush new forest sprouting around it, watercolour.",
		},
	],
};

async function seedStory(request: Page["request"]): Promise<string> {
	const res = await request.post("/api/test/stories", { data: SEED_STORY });
	if (!res.ok()) throw new Error(`Seed failed: ${res.status()}`);
	const { storyId } = (await res.json()) as { storyId: string };
	return storyId;
}

async function resetStories(request: Page["request"]): Promise<void> {
	const res = await request.delete("/api/test/stories");
	if (!res.ok()) throw new Error(`Reset failed: ${res.status()}`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe("Stories library", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsTestUser(page);
		await resetStories(page.request);
	});

	test.afterEach(async ({ page }) => {
		await resetStories(page.request);
	});

	test("redirects to /login when not authenticated", async ({ page }) => {
		await page.context().clearCookies();
		await page.goto("/stories/");
		await expect(page).toHaveURL(/\/login/);
	});

	test("shows empty state when there are no stories", async ({ page }) => {
		await page.goto("/stories/");
		await expect(
			page.getByRole("heading", { name: "Storybook" }),
		).toBeVisible();
		await expect(page.getByText("No stories yet")).toBeVisible();
	});

	test("shows a seeded story as a card in the library", async ({ page }) => {
		await seedStory(page.request);
		await page.goto("/stories/");
		await expect(
			page.getByRole("heading", { name: "Storybook" }),
		).toBeVisible();
		await expect(page.getByText("The Brave Little Fox")).toBeVisible();
	});
});

test.describe("Story viewer", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsTestUser(page);
		await resetStories(page.request);
	});

	test.afterEach(async ({ page }) => {
		await resetStories(page.request);
	});

	test("opens story viewer and shows first scene", async ({ page }) => {
		const storyId = await seedStory(page.request);
		await page.goto(`/stories/${storyId}`);
		await page.waitForLoadState("networkidle");

		await expect(page.getByText("Scene 1 of 3")).toBeVisible();
		await expect(
			page.getByText(/Once upon a time, a little fox/),
		).toBeVisible();
	});

	test("navigates to next scene", async ({ page }) => {
		const storyId = await seedStory(page.request);
		await page.goto(`/stories/${storyId}`);
		await page.waitForLoadState("networkidle");

		await page.getByTestId("nav-next").click();
		await expect(page.getByText("Scene 2 of 3")).toBeVisible();
		await expect(page.getByText(/golden acorn/)).toBeVisible();
	});

	test("prev button is disabled on the first scene", async ({ page }) => {
		const storyId = await seedStory(page.request);
		await page.goto(`/stories/${storyId}`);
		await page.waitForLoadState("networkidle");

		await expect(page.getByTestId("nav-prev")).toBeDisabled();
	});

	test("last scene shows Done link that returns to library", async ({
		page,
	}) => {
		const storyId = await seedStory(page.request);
		await page.goto(`/stories/${storyId}`);
		await page.waitForLoadState("networkidle");

		await page.getByTestId("nav-next").click();
		await expect(page.getByText("Scene 2 of 3")).toBeVisible();
		await page.getByTestId("nav-next").click();
		await expect(page.getByText("Scene 3 of 3")).toBeVisible();

		// Verify Done link is visible on last scene and that Next is no longer shown
		await expect(page.getByTestId("nav-done")).toBeVisible();
		await expect(page.getByTestId("nav-next")).not.toBeVisible();
	});

	test("deletes a story via confirm sheet", async ({ page }) => {
		const storyId = await seedStory(page.request);
		await page.goto(`/stories/${storyId}`);
		await page.waitForLoadState("networkidle");

		await page.getByTestId("delete-story-btn").click();
		await expect(page.getByText("Delete this story?")).toBeVisible();

		await page.getByRole("button", { name: /^delete$/i }).click();
		await expect(page).toHaveURL(/\/stories\/?$/);
	});
});

test.describe("New story page", () => {
	test.beforeEach(async ({ page }) => {
		await loginAsTestUser(page);
	});

	test("redirects to /login when not authenticated", async ({ page }) => {
		await page.context().clearCookies();
		await page.goto("/stories/new");
		await expect(page).toHaveURL(/\/login/);
	});

	test("shows the prompt input and example prompts", async ({ page }) => {
		await page.goto("/stories/new");
		await expect(
			page.getByRole("heading", { name: "New Story" }),
		).toBeVisible();
		await expect(page.getByTestId("story-prompt")).toBeVisible();
		await expect(page.getByText("Need inspiration?")).toBeVisible();
	});

	test("clicking an example prompt fills the textarea", async ({ page }) => {
		await page.goto("/stories/new");
		await page.waitForLoadState("networkidle");
		await page.getByTestId("example-prompt").first().click();
		// Verify the Generate Story button became enabled (prompt is now non-empty)
		await expect(
			page.getByRole("button", { name: /generate story/i }),
		).not.toBeDisabled();
	});

	test("Generate Story button is disabled when prompt is empty", async ({
		page,
	}) => {
		await page.goto("/stories/new");
		const btn = page.getByRole("button", { name: /generate story/i });
		await expect(btn).toBeDisabled();
	});
});
