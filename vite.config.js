import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base must match the GitHub repo name so assets resolve under username.github.io/<repo>/
export default defineConfig({
  plugins: [react()],
  base: "/cuestionario.vixion/",
});
