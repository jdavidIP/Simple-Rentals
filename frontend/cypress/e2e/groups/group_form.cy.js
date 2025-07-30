describe("Group Form E2E", () => {
  beforeEach(() => {
    cy.visit("/login");
    cy.get('input[name="email"]').type("test2@example.com");
    cy.get('input[name="password"]').type("securepassword");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/listings");
    cy.window().then((win) => {
      expect(win.localStorage.getItem("access")).to.exist;
      expect(win.localStorage.getItem("refresh")).to.exist;
    });
    cy.wait(2000);
    cy.visit("/listings/7/groups/post");
  });

  it("submits the form with valid data", () => {
    cy.intercept("POST", "/listings/7/groups/post").as("createGroup");

    cy.get('input[name="name"]').type("Test Group");
    cy.get('textarea[name="description"]').type("A cool group for testing.");
    cy.get('input[name="move_in_date"]').type("2025-08-01");
    cy.get('input[name="move_in_ready"]').check({ force: true });
    cy.get('select[name="group_status"]').select("Private");

    cy.get("button[type=submit]")
      .contains(/create group/i)
      .click();

    cy.url().should("include", "/listings/7/groups");
  });

  it("shows validation error if required fields are empty", () => {
    cy.get("button[type=submit]")
      .contains(/create group/i)
      .click();

    cy.get('input[name="name"]').then(($input) => {
      expect($input[0].checkValidity()).to.be.false;
      expect($input[0].validationMessage).to.eq("Please fill out this field.");
    });
  });

  it("edit and submit updated group", () => {
    cy.visit("/groups/edit/1");

    cy.get('input[name="name"]').clear().type("Updated Group");
    cy.get('textarea[name="description"]')
      .clear()
      .type("A cool updated description.");
    cy.get('select[name="group_status"]').select("Filled");

    cy.get("button[type='submit']")
      .contains(/save changes/i)
      .click();

    cy.url().should("include", "/groups/1");

    cy.contains("A cool updated description.");
    cy.contains(".meta .meta-label", /^Status$/)
      .closest(".meta")
      .find(".meta-value .status-badge")
      .should(($badge) => {
        const txt = $badge.text().trim();
        const title = $badge.attr("title") || "";
        expect(txt || title).to.match(/Filled/i);
      });
    cy.contains("Updated Group");
  });

  it("removes a user from the group and re-adds them", () => {
    cy.visit("/groups/edit/1");

    cy.contains("Remove").click();

    cy.get("button[type='submit']")
      .contains(/save changes/i)
      .click();

    cy.url().should("include", "/groups/1");
    cy.contains("test3@example.com").should("not.exist");

    cy.visit("/groups/edit/1");

    cy.get("input[placeholder='Enter name to search']").type("Test User3");
    cy.get("button").contains("Search").click();

    cy.get("select[name='members']")
      .should("contain", "test3@example.com")
      .select("Test User3 (test3@example.com)");

    cy.get("button").contains("Add").click();

    cy.get("button[type='submit']")
      .contains(/save changes/i)
      .click();

    // Go to invitation page
    cy.visit("/groups/invitations");

    // Click on "Sent" tab
    cy.get(".apps-tabs")
      .contains("button.apps-tab", /^Sent$/)
      .scrollIntoView()
      .click();

    cy.get(".groups-list")
      .should("contain", "To:")
      .and("contain", "test3@example.com");
  });
});
