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
		coverage: {
			provider: "v8",
			reporter: ["text", "json-summary"],
			reportsDirectory: "./coverage",
			// Exclude non-business-logic files from coverage measurement
			exclude: [
				"tests/**",
				"test/**",
				"dist/**",
				"src/routeTree.gen.ts",
				"src/paraglide/**",
				"src/routes/**",
				"src/components/**",
				"#/components/**",
				"src/integrations/**",
				"src/tanstack-query/**",
				"src/router.tsx",
				"src/server.ts",
				"src/auth/ui/**",
				"src/auth/infrastructure/**",
				"src/auth/application/**",
				"src/finance/ui/**",
				"src/finance/infrastructure/**",
				"src/finance/application/use-transactions.ts",
				"src/finance/application/transaction-server-fns.ts",
				"src/finance/application/use-categories.ts",
				"src/finance/application/category-server-fns.ts",
				"**/*.config.{ts,js}",
				"**/*.d.ts",
				"demo/**",
			],
		},
	},
});
