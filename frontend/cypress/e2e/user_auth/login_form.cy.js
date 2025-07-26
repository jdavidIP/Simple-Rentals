describe("Login Form", () => {
  it("logs in successfully with real credentials", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("securepassword");
    cy.get('button[type="submit"]').click();

    cy.url().should("include", "/listings");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("access")).to.exist;
      expect(win.localStorage.getItem("refresh")).to.exist;
    });
  });

  it("shows error on failed login", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("wrong@example.com");
    cy.get('input[name="password"]').type("wrongpass");
    cy.get('button[type="submit"]').click();

    cy.contains("Login failed. Please check your credentials.").should("exist");
  });
});
