describe("User Registration", () => {
  it("fills out and submits the 3-step registration form", () => {
    cy.visit("/register");

    // --- Step 1: Credentials ---
    cy.get('input[name="email"]').type("testuser@example.com");
    cy.get('input[name="password"]').type("testpassword123");
    cy.get('input[name="password_confirmation"]').type("testpassword123");
    cy.contains("button", "Next").click();

    // --- Step 2: Basic Info ---
    cy.get('input[name="first_name"]').type("John");
    cy.get('input[name="last_name"]').type("Doe");
    cy.get('input[name="age"]').type("30");

    cy.get('input[name="phone_number"]').type("+1-226-339-4921");
    cy.get('input[name="budget_max"]').type("2000");
    cy.get('select[name="sex"]').select("Male");

    cy.contains("button", "Next").click();

    // --- Step 3: Extras ---
    // Optionally skip file upload in CI
    cy.get('input[name="instagram_link"]').type(
      "https://instagram.com/testuser"
    );
    cy.get('input[name="facebook_link"]').type("https://facebook.com/testuser");
    cy.get('input[name="receive_email_notifications"]').check({ force: true });
    cy.get('input[name="receive_sms_notifications"]').check({ force: true });
    cy.get('input[name="terms_accepted"]').check({ force: true });

    cy.contains("button", "Register").click();

    cy.wait(6000);

    // --- Assert we're redirected to login or wherever ---
    cy.url().should("include", "/login");
  });
});
