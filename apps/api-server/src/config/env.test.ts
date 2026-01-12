import { describe, expect, it } from "vitest";
import { env } from "./env.js";

describe("Environment Configuration", () => {
	describe("Environment Variables", () => {
		it("should load environment configuration", () => {
			expect(env).toBeDefined();
		});

		it("should have required DATABASE_URL", () => {
			expect(env.DATABASE_URL).toBeDefined();
			expect(typeof env.DATABASE_URL).toBe("string");
		});

		it("should have required BETTER_AUTH_SECRET", () => {
			expect(env.BETTER_AUTH_SECRET).toBeDefined();
			expect(typeof env.BETTER_AUTH_SECRET).toBe("string");
		});

		it("should have PORT as number", () => {
			expect(env.PORT).toBeDefined();
			expect(typeof env.PORT).toBe("number");
		});

		it("should have HOST as string", () => {
			expect(env.HOST).toBeDefined();
			expect(typeof env.HOST).toBe("string");
		});

		it("should have valid NODE_ENV", () => {
			expect(env.NODE_ENV).toBeDefined();
			expect(["development", "production", "test"]).toContain(
				env.NODE_ENV,
			);
		});

		it("should have CORS_ORIGIN", () => {
			expect(env.CORS_ORIGIN).toBeDefined();
			expect(typeof env.CORS_ORIGIN).toBe("string");
		});

		it("should have valid LOG_LEVEL", () => {
			expect(env.LOG_LEVEL).toBeDefined();
			expect([
				"fatal",
				"error",
				"warn",
				"info",
				"debug",
				"trace",
			]).toContain(env.LOG_LEVEL);
		});
	});
});
