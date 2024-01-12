const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        // baseUrl: "https://example.cypress.io/",
        baseUrl: "http://localhost:8000/",
        defaultCommandTimeout: 2000,
        specPattern: "./tests/cypress/**/*.cy.js",
        supportFile: "./tests/cypress/support/e2e.js",
    },
});
