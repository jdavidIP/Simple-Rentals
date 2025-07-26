describe("Roommate Form E2E", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("securepassword");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/listings");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("access")).to.exist;
      expect(win.localStorage.getItem("refresh")).to.exist;
    });
    cy.wait(2000);
    cy.visit("/roommates/post");
  });

  it("submits the form with valid data", () => {
    cy.intercept("POST", "/roommates/post").as("createRoommate");

    cy.get("textarea[name='description']").type(
      "Looking for a quiet roommate."
    );
    cy.get("input[name='move_in_date']").type("2025-09-01");
    cy.get("input[name='stay_length']").type("6");
    cy.get("select[name='occupation']").select("Student");
    cy.get("input[name='roommate_budget']").type("1000");
    cy.get("select[name='gender_preference']").select("Open");

    // Check a few lifestyle boxes
    cy.get("input[name='pet_friendly']").check({ force: true });
    cy.get("input[name='smoke_friendly']").check({ force: true });

    cy.get("button[type='submit']")
      .contains(/register roommate/i)
      .click();

    cy.wait("@createRoommate").its("response.statusCode").should("eq", 201);
    cy.url().should("include", "/roommates");
  });

  it("shows validation errors on empty submit", () => {
    cy.get("button[type='submit']")
      .contains(/register roommate/i)
      .click();

    cy.get('textarea[name="description"]').then(($input) => {
      expect($input[0].checkValidity()).to.be.false;
      expect($input[0].validationMessage).to.eq("Please fill out this field.");
    });
  });

  it("edits and submits updated profile", () => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("test2@example.com");
    cy.get('input[name="password"]').type("securepassword");
    cy.get('button[type="submit"]').click();
    cy.wait(2000);

    cy.visit("/roommates/edit/6");
    cy.intercept("PATCH", "/roommates/edit/5").as("editRoommate");

    cy.get("textarea[name='description']")
      .clear()
      .type("Updated roommate looking for chill space.");
    cy.get("input[name='stay_length']").clear().type("12");
    cy.get('select[name="occupation"]').select("Employed");

    cy.get("button[type='submit']")
      .contains(/save changes/i)
      .click();

    // Confirm we're on the detail page for roommate 6
    cy.url().should("include", "/roommates/6");

    // Assert updated values show on the page
    cy.contains("Updated roommate looking for chill space.");
    cy.contains("Stay Length:").parent().should("contain", "12 months");
    cy.contains("Employed"); // Occupation
  });
});
