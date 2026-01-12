import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["**/*.test.ts"],
		exclude: ["**/node_modules/**", "**/.git/**"],
		coverage: {
			provider: "v8",
			reporter: ["json", "text"],
			reportsDirectory: "./coverage",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.test.ts", "src/types/**", "src/index.ts"],
		},
	},
});
