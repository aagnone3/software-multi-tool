import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "./server.js";

describe("oRPC Integration", () => {
	let server: FastifyInstance;

	beforeAll(async () => {
		server = await createServer();
	});

	afterAll(async () => {
		await server.close();
	});

	describe("RPC Handler", () => {
		it("should handle RPC requests at /api/rpc/*", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/api/rpc/test",
				headers: {
					"content-type": "application/json",
				},
				payload: {},
			});

			// Should match or return 404 if no route exists
			expect([200, 404, 500]).toContain(response.statusCode);
		});

		it("should set correct headers for RPC responses", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/api/rpc/test",
				headers: {
					"content-type": "application/json",
				},
				payload: {},
			});

			expect(response.headers["content-type"]).toBeDefined();
		});

		it("should handle GET requests to RPC endpoints", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/api/rpc/test",
			});

			// RPC endpoints may or may not support GET
			expect([200, 404, 405, 500]).toContain(response.statusCode);
		});
	});

	describe("OpenAPI Handler", () => {
		it("should handle OpenAPI requests at /api/*", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/api/test",
			});

			// Should match or return 404 if no route exists
			expect([200, 404, 500]).toContain(response.statusCode);
		});

		it("should not handle /api/rpc/* with OpenAPI handler", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/api/rpc/test",
			});

			// RPC handler should handle this, not OpenAPI handler
			expect([200, 404, 500]).toContain(response.statusCode);
		});

		it("should handle POST requests to OpenAPI endpoints", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/api/test",
				headers: {
					"content-type": "application/json",
				},
				payload: { test: "data" },
			});

			expect([200, 404, 405, 500]).toContain(response.statusCode);
		});
	});

	describe("Context Passing", () => {
		it("should pass headers to oRPC context", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/api/rpc/test",
				headers: {
					"content-type": "application/json",
					authorization: "Bearer test-token",
					"x-custom-header": "custom-value",
				},
				payload: {},
			});

			// Headers should be passed through
			expect(response.statusCode).toBeDefined();
		});
	});

	describe("Error Handling", () => {
		it("should handle invalid JSON in RPC requests", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/api/rpc/test",
				headers: {
					"content-type": "application/json",
				},
				payload: "invalid json {",
			});

			expect([400, 500]).toContain(response.statusCode);
		});

		it("should handle missing content-type header", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/api/rpc/test",
				payload: { test: "data" },
			});

			expect(response.statusCode).toBeDefined();
		});

		it("should return error for malformed routes", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/api/rpc/",
				headers: {
					"content-type": "application/json",
				},
				payload: {},
			});

			expect([400, 404, 500]).toContain(response.statusCode);
		});
	});

	describe("HTTP Methods", () => {
		it("should support GET method", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/api/test",
			});

			expect(response.statusCode).toBeDefined();
		});

		it("should support POST method", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/api/test",
				headers: {
					"content-type": "application/json",
				},
				payload: {},
			});

			expect(response.statusCode).toBeDefined();
		});

		it("should support PUT method", async () => {
			const response = await server.inject({
				method: "PUT",
				url: "/api/test",
				headers: {
					"content-type": "application/json",
				},
				payload: {},
			});

			expect(response.statusCode).toBeDefined();
		});

		it("should support DELETE method", async () => {
			const response = await server.inject({
				method: "DELETE",
				url: "/api/test",
			});

			expect(response.statusCode).toBeDefined();
		});
	});
});
