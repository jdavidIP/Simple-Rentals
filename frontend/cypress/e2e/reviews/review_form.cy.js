describe("Review Form E2E", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("test@example.com");
    cy.get('input[name="password"]').type("securepassword");
    cy.get('button[type="submit"]').click();

    // Confirm login by checking for successful redirect and tokens
    cy.url().should("include", "/listings");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("access")).to.exist;
      expect(win.localStorage.getItem("refresh")).to.exist;
    });

    cy.wait(1000); // slight wait to ensure tokens are fully registered
  });

  it("posts a review with valid data", () => {
    cy.intercept("POST", "**/profile/reviews/**").as("postReview");

    cy.visit("/profile/99/reviews");
    cy.get("select[id='rating']").select("4");
    cy.get("select[id='revieweeRole']").select("R");
    cy.get("textarea[id='comment']").clear().type("Nice Test2 Guy!");

    cy.get("button[type='submit']")
      .contains(/submit review/i)
      .click();

    cy.wait("@postReview").its("response.statusCode").should("eq", 201);

    cy.url().should("include", "/profile/99");
    cy.contains("Nice Test2 Guy!");
    cy.contains("Roommate");
    cy.contains("4");
  });

  it("shows validation error if user has been previously reviewed", () => {
    cy.visit("/profile/99/reviews");

    cy.get("textarea[id='comment']").clear().type("Nice Test2 Guy!");
    cy.get("button[type='submit']")
      .contains(/submit review/i)
      .click();

    cy.get(".error-list").contains(
      "You have already posted a review on this user."
    );
  });

  it("shows validation errors on short comment submit", () => {
    cy.visit("/profile/98/reviews");

    cy.get("select[id='rating']").select(4);
    cy.get("select[id='revieweeRole']").select("R");
    cy.get("textarea[id='comment']").clear().type("Hi");

    cy.get("button[type='submit']")
      .contains(/submit review/i)
      .click();

    cy.contains("Comment must be at least 10 characters.");
  });

  it("edits an existing review and posts it successfully", () => {
    cy.intercept("PATCH", "**/reviews/manage/**").as("editReview");

    cy.visit("/reviews/edit/123");

    cy.get("select[id='revieweeRole']").select("R");
    cy.get("textarea[id='comment']").clear().type("Updated Comment babyyy!!");

    cy.get("button[type='submit']")
      .contains(/save changes/i)
      .click();

    cy.wait("@editReview").its("response.statusCode").should("eq", 200);

    cy.url().should("include", "/profile/98");
    cy.contains("Updated Comment babyyy!!");
    cy.contains("Roommate");
  });
});
