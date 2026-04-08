import { expect, test } from "@playwright/test";

/**
 * E2E tests for the observability layer.
 *
 * Covers the HTTP contract of POST /api/report-error and a smoke test
 * confirming the ErrorBoundary does not interfere with normal rendering.
 * The ErrorBoundary fallback UI itself requires a throwable route to
 * exercise in isolation — tested here via the API endpoint it calls.
 */

test.describe("POST /api/report-error", () => {
	test("returns 204 for a valid error payload", async ({ request }) => {
		const response = await request.post("/api/report-error", {
			data: {
				message: "E2E test error",
				stack: "Error: E2E test error\n  at test (/app/test.ts:1:1)",
				route: "/test",
			},
		});
		expect(response.status()).toBe(204);
	});

	test("returns 204 when optional fields are absent", async ({ request }) => {
		const response = await request.post("/api/report-error", {
			data: {},
		});
		expect(response.status()).toBe(204);
	});

	test("returns 204 when only route is provided", async ({ request }) => {
		const response = await request.post("/api/report-error", {
			data: { route: "/finance/" },
		});
		expect(response.status()).toBe(204);
	});
});

test.describe("ErrorBoundary", () => {
	test("home page renders without triggering the error boundary", async ({
		page,
	}) => {
		await page.goto("/");
		// If the ErrorBoundary had caught a render error, the fallback text would be visible.
		await expect(page.getByText("Something went wrong")).not.toBeVisible();
	});
});
