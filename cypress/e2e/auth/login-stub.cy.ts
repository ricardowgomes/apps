describe("Auth stub", () => {
	it("loginAsTestUser sets a valid session and /finance loads without redirect", () => {
		cy.loginAsTestUser();
		cy.visit("/finance");
		cy.url().should("not.include", "/login");
		cy.get("h1").contains("Transactions").should("be.visible");
	});
});
