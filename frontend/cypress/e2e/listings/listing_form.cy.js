// cypress/e2e/listings/listing_form.cy.test.js

/// <reference types="cypress" />

const getAdditionalImagesGrid = () =>
  cy
    .contains("label", /^Additional Images$/)
    .parent() // <div class="mb-3">
    .find(".image-preview-grid");

// Selector list that covers common preview UIs (img, div tiles, canvas, etc.)
const TILE_SELECTORS =
  'img, .image-tile, [data-preview], [role="img"], canvas, .preview-thumb';

const gridTiles = () =>
  getAdditionalImagesGrid().find(
    'img, .image-tile, [data-preview], [role="img"]'
  );

const removeButton = (scope = getAdditionalImagesGrid()) =>
  scope.find('button.image-remove, [aria-label="Remove"], [title="Remove"]');

// Get the current number of tiles WITHOUT requiring any to exist (can be 0)
const countTiles = () =>
  getAdditionalImagesGrid().then(($grid) => {
    const $tiles = Cypress.$($grid).find(TILE_SELECTORS);
    return $tiles.length; // returns a plain number
  });

// Click a remove button robustly (icon-only, class, or aria/ title)
const clickLastRemove = () =>
  getAdditionalImagesGrid().within(() => {
    cy.get(
      'button.image-remove, [data-testid="remove-image"], [aria-label*="Remove"], [title*="Remove"], .preview-remove'
    )
      .last()
      .scrollIntoView()
      .click({ force: true }); // icon-only buttons often need force
  });

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

    // 1) Count current tiles (can be 0)
    countTiles().then((initial) => {
      // 2) Upload one file
      cy.get('input[type="file"][name="pictures"]').attachFile(imagePath);

      // 3) Wait until a tile appears (length > initial)
      getAdditionalImagesGrid()
        .find(TILE_SELECTORS, { timeout: 10000 })
        .should(($els) => {
          expect($els.length).to.be.greaterThan(initial);
        });

      // 4) Remove the last/most recent tile
      clickLastRemove();

      // 5) Confirm we're back to the original count
      //    Use countTiles() again so we don't require elements to exist
      countTiles().should("eq", initial);
    });
  });

  // Edit mode: test deleting an existing image
  it("deletes an existing image in edit mode", () => {
    cy.visit("/listings/edit/7");

    // Ensure existing tiles are visible
    gridTiles({ timeout: 10000 }).should("exist");

    // Count tiles before deletion
    gridTiles()
      .its("length")
      .then((before) => {
        // Click the first remove button inside the grid
        getAdditionalImagesGrid().within(() => {
          removeButton(cy.root()).first().scrollIntoView().click();
        });

        // Tiles should decrease
        gridTiles().should("have.length.lessThan", before);

        // Submit and confirm PATCH succeeded
        cy.get("button[type='submit']")
          .contains(/save changes/i)
          .click();

        // Detail page assertions
        cy.url().should("include", "/listings/7");
        cy.get(".carousel-inner .carousel-item", { timeout: 10000 })
          .its("length")
          .should("be.lt", before); // carousel count went down
      });
  });

  // Edit mode: test deleting an existing image
  it("adds an image in edit mode", () => {
    cy.visit("/listings/edit/7");

    // Wait for existing images in grid
    getAdditionalImagesGrid().find("img", { timeout: 10000 }).should("exist");

    // Count current thumbnails
    getAdditionalImagesGrid()
      .find("img")
      .its("length")
      .then((before) => {
        const imagePath = "images/image2_test.jpg";
        cy.get('input[type="file"][name="pictures"]').attachFile(imagePath);

        // Expect one more thumbnail appears
        getAdditionalImagesGrid()
          .find("img", { timeout: 8000 })
          .should("have.length", before + 1);

        cy.get("button[type='submit']")
          .contains(/save changes/i)
          .click();

        cy.url().should("include", "/listings/7");

        // On the detail view, the carousel should have at least previous + 1 slides
        cy.get(".carousel-inner .carousel-item", { timeout: 10000 })
          .its("length")
          .should("be.gte", before + 1);
      });
  });
});
