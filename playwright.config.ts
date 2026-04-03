import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "tests/e2e",
	fullyParallel: false,
	// Single worker required: all suites share the same local D1 database, so
	// parallel test files would race on resetTransactions / seedTransactions.
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: "list",
	use: {
		baseURL: "http://localhost:3000",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	// Auto-start the dev server when running E2E tests (skip if already running)
	webServer: {
		command: "npm run dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 60_000,
	},
});
