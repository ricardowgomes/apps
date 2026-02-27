import type { Page } from "@playwright/test";

/**
 * Seeds a test session in local D1 without going through real Google OAuth.
 * Mirrors the old cy.loginAsTestUser() Cypress command.
 * Requires the /api/test/login endpoint to be available (development only).
 */
export async function loginAsTestUser(page: Page): Promise<void> {
	const response = await page.request.get("/api/test/login");
	const { sessionId, cookieName } = (await response.json()) as {
		sessionId: string;
		cookieName: string;
	};
	await page.context().addCookies([
		{
			name: cookieName,
			value: sessionId,
			domain: "localhost",
			path: "/",
			httpOnly: true,
			secure: false,
			sameSite: "Lax",
		},
	]);
}
