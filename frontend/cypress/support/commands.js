// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
Cypress.Commands.add("loginViaApi", () => {
  cy.request({
    method: "POST",
    url: "http://localhost:8000/login/", // Or your login API
    form: true,
    body: {
      email: "test@example.com",
      username: "test",
      password: "securepassword",
    },
  }).then((resp) => {
    // Grab the session cookie from response and set it manually
    const cookies = resp.headers["set-cookie"];
    if (cookies) {
      cookies.forEach((cookie) => {
        const [nameValue] = cookie.split(";");
        const [name, value] = nameValue.split("=");
        cy.setCookie(name.trim(), value.trim());
      });
    }
  });
});
