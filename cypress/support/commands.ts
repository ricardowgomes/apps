// Custom Cypress commands
// See: https://on.cypress.io/custom-commands

Cypress.Commands.add("loginAsTestUser", () => {
	cy.request("/api/test/login").then((response) => {
		const { sessionId, cookieName } = response.body as {
			sessionId: string;
			cookieName: string;
		};
		cy.setCookie(cookieName, sessionId, {
			domain: "localhost",
			path: "/",
			httpOnly: true,
			secure: false,
		});
	});
});
