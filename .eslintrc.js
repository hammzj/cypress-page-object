//@see https://dev.to/studio_m_song/how-to-make-eslint-work-with-prettier-avoiding-conflicts-and-problems-57pi
module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
    },
    extends: ["eslint:recommended", "prettier"],
    parserOptions: {
        ecmaVersion: "latest",
    },
    rules: {
        "no-console": "off",
        "no-case-declarations": "warn",
        "no-prototype-builtins": "off",
        "prettier/prettier": "error",
    },
    globals: {
        "chai": "readonly",
        "Cypress": "readonly",
        "cy": "readonly",
        "expect": "readonly",
        "before": "readonly",
        "beforeEach": "readonly",
        "after": "readonly",
        "afterEach": "readonly",
    },
    plugins: ["prettier"],
};
