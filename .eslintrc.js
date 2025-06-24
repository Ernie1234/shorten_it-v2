module.exports = {
  root: true,
  ignorePatterns: ["node_modules", "dist", ".turbo"],
  extends: ["prettier"],
  plugins: ["prettier"],
  rules: { "prettier/prettier": "warn" },
};
