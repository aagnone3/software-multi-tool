import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "./server.js";

describe("Fastify Server", () => {
	let server: FastifyInstance;

	beforeAll(async () => {
		server = await createServer();
	});

	afterAll(async () => {
		await server.close();
	});

	describe("Server Initialization", () => {
		it("should create server instance", () => {
			expect(server).toBeDefined();
			expect(server.server).toBeDefined();
		});

		it("should have CORS plugin registered", () => {
			// Fastify plugins are registered asynchronously
			// Check that CORS headers are set on a request
			expect(server.hasPlugin("@fastify/cors")).toBe(true);
		});

		it("should have WebSocket plugin registered", () => {
			expect(server.hasPlugin("@fastify/websocket")).toBe(true);
		});
	});

	describe("Health Check Endpoint", () => {
		it("should respond to GET /health", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/health",
			});

			expect(response.statusCode).toBe(200);
			expect(response.body).toBe("OK");
		});

		it("should respond to GET /api/health (proxied health check)", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/api/health",
			});

			expect(response.statusCode).toBe(200);
			expect(response.body).toBe("OK");
		});

		it("should return correct content-type", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/health",
			});

			expect(response.headers["content-type"]).toContain("text/plain");
		});

		it("should return same response for /health and /api/health", async () => {
			const healthResponse = await server.inject({
				method: "GET",
				url: "/health",
			});

			const apiHealthResponse = await server.inject({
				method: "GET",
				url: "/api/health",
			});

			expect(healthResponse.statusCode).toBe(
				apiHealthResponse.statusCode,
			);
			expect(healthResponse.body).toBe(apiHealthResponse.body);
		});
	});

	describe("CORS Configuration", () => {
		it("should include CORS headers in response", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/health",
				headers: {
					origin: "http://localhost:3500",
				},
			});

			expect(
				response.headers["access-control-allow-origin"],
			).toBeDefined();
			expect(response.headers["access-control-allow-credentials"]).toBe(
				"true",
			);
		});

		it("should handle OPTIONS preflight requests", async () => {
			const response = await server.inject({
				method: "OPTIONS",
				url: "/api/health",
				headers: {
					origin: "http://localhost:3500",
					"access-control-request-method": "POST",
				},
			});

			expect(response.statusCode).toBe(204);
			expect(response.headers["access-control-allow-methods"]).toContain(
				"POST",
			);
		});
	});

	describe("Error Handling", () => {
		it("should return 404 for unknown routes", async () => {
			const response = await server.inject({
				method: "GET",
				url: "/unknown-route",
			});

			expect(response.statusCode).toBe(404);
		});

		it("should handle malformed JSON gracefully", async () => {
			const response = await server.inject({
				method: "POST",
				url: "/api/test",
				headers: {
					"content-type": "application/json",
				},
				payload: "invalid json {",
			});

			// Should return 400 or 500 depending on implementation
			expect([400, 404, 500]).toContain(response.statusCode);
		});
	});
});
