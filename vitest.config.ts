import path from "node:path";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths()],
	resolve: {
		alias: {
			// Support #/* imports (package.json "imports" field)
			"#": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		// Using "node" environment because jsdom 27 depends on ESM-only packages
		// incompatible with Node 20 (CJS require() of ESM modules fails).
		// Switch to "jsdom" when the project upgrades to Node 22+, which supports
		// --experimental-require-module and enables React component render tests.
		environment: "node",
		globals: true,
		exclude: ["tests/e2e/**", "node_modules/**"],
	},
});
