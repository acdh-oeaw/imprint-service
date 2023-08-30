import { defineConfig } from "tsup";

export default defineConfig({
	clean: true,
	format: "esm",
	outDir: "./dist",
	sourcemap: true,
	target: "es2022",
});
