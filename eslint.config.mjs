import js from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig } from "eslint/config";

export default defineConfig([
  eslintPluginPrettierRecommended,
  {
    files: ["**/*.{js}"],
    plugins: { js },
    extends: ["js/recommended"],
  },
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
    rules: {
      "prefer-const": "error",
    },
  },
]);
