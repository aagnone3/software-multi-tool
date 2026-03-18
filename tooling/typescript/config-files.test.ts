import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = __dirname;

function readJson(relativePath: string) {
	const filePath = path.join(root, relativePath);
	const raw = readFileSync(filePath, "utf8");
	return JSON.parse(raw) as Record<string, unknown>;
}

describe("@repo/tsconfig config files", () => {
	it("base.json defines compilerOptions", () => {
		const base = readJson("base.json");

		expect(base).toHaveProperty("compilerOptions");
		expect(typeof base.compilerOptions).toBe("object");
	});

	it("nextjs.json extends the shared base config", () => {
		const nextjs = readJson("nextjs.json");

		expect(nextjs).toMatchObject({
			extends: "./base.json",
		});
	});

	it("react-library.json extends the shared base config", () => {
		const reactLibrary = readJson("react-library.json");

		expect(reactLibrary).toMatchObject({
			extends: "./base.json",
		});
	});
});
