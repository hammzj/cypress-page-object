import { defineConfig } from "cypress";

module.exports = defineConfig({
    e2e: {
        baseUrl: "http://localhost:8000/",
        defaultCommandTimeout: 2000,
        specPattern: "./tests/cypress/**/*.cy.ts",
        supportFile: false,
    },
});
