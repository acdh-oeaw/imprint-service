import { defineConfig } from "tsdown";

export default defineConfig({
	clean: true,
	format: "esm",
	outDir: "./dist",
	sourcemap: true,
	target: "es2023",
});
