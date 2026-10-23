import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://dilocreativelab.local",
  output: "static",
  trailingSlash: "never",
  build: {
    format: "file",
  },
});
