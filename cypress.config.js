const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        baseUrl: "https://example.cypress.io/",
        defaultCommandTimeout: 2000,
        specPattern: "./tests/cypress/**/*.cy.js",
        supportFile: "./tests/cypress/support/e2e.js",
    },
});
