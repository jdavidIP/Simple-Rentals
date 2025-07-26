// cypress/e2e/listings/listing_form.cy.test.js

/// <reference types="cypress" />

describe("Listing Form E2E", () => {
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
    cy.visit("/listings/post");
  });

  it("fills out the form and uploads images", () => {
    // Fill required fields
    cy.get('input[name="street_address"]').type("456 Cypress Ave");
    cy.get('input[name="city"]').type("Testville");
    cy.get("input[name=postal_code]").type("N2T 2K1");
    cy.get('input[name="price"]').type("2000");
    cy.get('select[name="property_type"]').select(1);
    cy.get('input[name="sqft_area"]').type(2000);
    cy.get('select[name="payment_type"]').select(1);
    cy.get('select[name="laundry_type"]').select(1);
    cy.get('input[name="bedrooms"]').type(3);
    cy.get('input[name="bathrooms"]').type(2);
    cy.get('input[name="parking_spaces"]').type(1);
    cy.get('input[name="move_in_date"]').type("2025-08-01");
    cy.get('textarea[name="description"]').type("A beautiful test listing.");

    // Upload images
    const frontImagePath = "images/front_image_test.jpg";
    const imagePath1 = "images/image2_test.jpg";
    const imagePath2 = "images/image3_test.jpg";
    const imagePath3 = "images/image4_test.jpg";
    cy.get('input[type="file"][name="front_image"]').attachFile(frontImagePath);
    cy.get('input[type="file"][name="pictures"]').attachFile([
      imagePath1,
      imagePath2,
      imagePath3,
    ]);

    // Intercept the POST request
    cy.intercept("POST", "/listings/create").as("createListing");

    // Submit the form
    cy.get('button[type="submit"]')
      .contains(/create listing/i)
      .click();

    // Wait for request and check FormData
    cy.url().should("include", "/listings");
  });

  it("shows validation errors on empty submit", () => {
    cy.get('button[type="submit"]')
      .contains(/create listing/i)
      .click();

    cy.get('input[name="street_address"]').then(($input) => {
      expect($input[0].checkValidity()).to.be.false;
      expect($input[0].validationMessage).to.eq("Please fill out this field.");
    });
  });

  it("removes an uploaded image before submit", () => {
    const imagePath = "images/image2_test.jpg";
    cy.get('input[type="file"][name="pictures"]').attachFile(imagePath);

    cy.get(".image-container img").should("have.length", 1);

    cy.get(".image-container button")
      .contains(/remove/i)
      .click();

    cy.get(".image-container img").should("have.length", 0);
  });

  // Edit mode: test deleting an existing image
  it("deletes an existing image in edit mode", () => {
    // Visit edit page for listing with id 123
    cy.visit("/listings/edit/7");

    // Existing images should be rendered
    cy.get(".image-container img").should("exist");

    // Click delete on the first image
    cy.get(".image-container")
      .last() // Get the last image container
      .within(() => {
        cy.contains(/delete/i).click(); // Click the delete button inside it
      });

    // Image should be removed from preview
    cy.get(".image-container img").should("have.length.lessThan", 5);

    // Submit and intercept PATCH
    cy.intercept("PATCH", "/listings/edit/7").as("editListing");
    cy.get('button[type="submit"]')
      .contains(/save changes/i)
      .click();

    cy.url().should("include", "/listings/7");
    cy.get(".carousel-inner .carousel-item").should("have.length.lessThan", 5);
  });

  // Edit mode: test deleting an existing image
  it("adds an image in edit mode", () => {
    // Visit edit page for listing with id 123
    cy.visit("/listings/edit/7");

    // Existing images should be rendered
    cy.get(".image-container img").should("exist");

    const imagePath = "images/image2_test.jpg";
    cy.get('input[type="file"][name="pictures"]').attachFile(imagePath);

    // Image should be removed from preview
    cy.get(".image-container img").should("have.length", 5);

    // Submit and intercept PATCH
    cy.intercept("PATCH", "/listings/edit/7").as("editListing");
    cy.get('button[type="submit"]')
      .contains(/save changes/i)
      .click();

    cy.url().should("include", "/listings/7");
    cy.get(".carousel-inner .carousel-item").should("have.length", 5);
  });
});
