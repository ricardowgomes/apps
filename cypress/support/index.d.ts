/// <reference types="cypress" />

declare namespace Cypress {
	interface Chainable {
		/**
		 * Seeds a D1 session for the test user (test@example.com) via
		 * GET /api/test/login and sets the resulting session_id cookie.
		 * Requires the app to be running with CYPRESS=true in the environment.
		 *
		 * @example cy.loginAsTestUser()
		 */
		loginAsTestUser(): void;
	}
}
