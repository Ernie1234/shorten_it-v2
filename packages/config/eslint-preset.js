module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier", // Ensures Prettier formatting rules are applied
    "plugin:prettier/recommended", // Runs Prettier as an ESLint rule
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  env: {
    node: true,
    es2021: true,
  },
  rules: {
    // Customize ESLint rules here
    "prettier/prettier": "warn",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
};
