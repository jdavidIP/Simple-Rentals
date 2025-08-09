describe("User Registration", () => {
  beforeEach(() => {
    cy.visit("/register");

    cy.window().then((win) => {
      win.google = {
        maps: {
          places: {
            Autocomplete: class {
              addListener() {}
            },
          },
          event: { clearInstanceListeners() {} },
        },
      };
    });
  });

  it("fills out and submits the 3-step registration form", () => {
    // --- Step 1: Credentials ---
    cy.get('input[name="email"]').type("testuser@example.com");
    cy.get('input[name="password"]').type("testpassword123");
    cy.get('input[name="password_confirmation"]').type("testpassword123");
    cy.contains("button", "Next").click();

    // --- Step 2: Basic Info ---
    cy.get('input[name="first_name"]').type("John");
    cy.get('input[name="last_name"]').type("Doe");
    cy.get('input[name="age"]').type("30");

    cy.get('input[name="city"]').clear().type("New York");
    cy.get('input[name="preferred_location"]').clear().type("New York");

    cy.get('input[name="phone_number"]').type("+1-226-339-4921");
    cy.get('input[name="budget_max"]').type("2000");
    cy.get('select[name="sex"]').select("Male");

    cy.contains("button", "Next").click();

    // --- Step 3: Extras ---
    cy.get('input[name="receive_email_notifications"]').check({ force: true });
    cy.get('input[name="receive_sms_notifications"]').check({ force: true });
    cy.get('input[name="terms_accepted"]').check({ force: true });

    cy.contains("button", "Register").click();

    cy.url().should("include", "/login");
  });
});
