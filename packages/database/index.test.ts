import { describe, expect, it } from "vitest";
import * as databaseModule from "./index";

describe("@repo/database exports", () => {
	it("exports db as a named export", () => {
		// Verify db is exported as a named export (not just under default)
		// This is critical for tsx ESM interop compatibility
		expect(databaseModule).toHaveProperty("db");
		expect(typeof databaseModule.db).toBe("object");
	});

	it("exports Prisma namespace as a named export", () => {
		expect(databaseModule).toHaveProperty("Prisma");
		expect(typeof databaseModule.Prisma).toBe("object");
	});

	it("exports PrismaClient as a named export", () => {
		expect(databaseModule).toHaveProperty("PrismaClient");
		expect(typeof databaseModule.PrismaClient).toBe("function");
	});

	it("exports zodSchemas as a named export", () => {
		expect(databaseModule).toHaveProperty("zodSchemas");
		expect(typeof databaseModule.zodSchemas).toBe("object");
	});
});
