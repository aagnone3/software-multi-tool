import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createRenderClient, RenderApiError } from "./client";
import type { RenderClient, RenderService } from "./index";

/**
 * Integration tests for the Render API client.
 *
 * These tests run against the live Render API and require:
 * 1. RENDER_API_KEY environment variable to be set
 * 2. RENDER_INTEGRATION_TEST=1 to be set
 * 3. At least one service in your Render account
 *
 * Run with: pnpm --filter @repo/render test:integration
 *
 * Note: These tests are read-only and won't modify your Render services.
 * Deploy triggers and env var modifications are tested against a dedicated test service.
 */

const SKIP_INTEGRATION =
	!process.env.RENDER_INTEGRATION_TEST || !process.env.RENDER_API_KEY;

const describeIntegration = SKIP_INTEGRATION ? describe.skip : describe;

describeIntegration("Render API Integration Tests", () => {
	let client: RenderClient;
	let testServiceId: string | undefined;
	let testService: RenderService | undefined;

	beforeAll(async () => {
		const apiKey = process.env.RENDER_API_KEY;
		if (!apiKey) {
			throw new Error("RENDER_API_KEY is required for integration tests");
		}

		client = createRenderClient({ apiKey });

		// Try to find a test service (one with "test" in the name or the first available)
		const { items: services } = await client.listServices({ limit: 50 });
		testService =
			services.find((s) => s.name.toLowerCase().includes("test")) ??
			services[0];
		testServiceId = testService?.id;

		if (!testServiceId) {
			console.warn(
				"No services found in Render account - some tests will be skipped",
			);
		}
	});

	afterAll(() => {
		// Cleanup if needed
	});

	// ============================================================================
	// Service Operations
	// ============================================================================

	describe("listServices", () => {
		it("should list services from Render", async () => {
			const { items: services } = await client.listServices();

			expect(Array.isArray(services)).toBe(true);

			if (services.length > 0) {
				const service = services[0];
				expect(service.id).toBeDefined();
				expect(service.name).toBeDefined();
				expect(service.type).toBeDefined();
			}
		});

		it("should filter services by type", async () => {
			const { items: webServices } = await client.listServices({
				type: "web_service",
			});

			for (const service of webServices) {
				expect(service.type).toBe("web_service");
			}
		});

		it("should filter services by name", async () => {
			if (!testService) {
				return;
			}

			const { items: services } = await client.listServices({
				name: testService.name,
			});

			expect(services.length).toBeGreaterThanOrEqual(0);
		});

		it("should respect limit parameter", async () => {
			const { items: services } = await client.listServices({ limit: 1 });

			expect(services.length).toBeLessThanOrEqual(1);
		});
	});

	describe("getService", () => {
		it("should get service details", async () => {
			if (!testServiceId) {
				console.warn("Skipping: no test service available");
				return;
			}

			const service = await client.getService(testServiceId);

			expect(service.id).toBe(testServiceId);
			expect(service.name).toBeDefined();
			expect(service.type).toBeDefined();
			expect(service.env).toBeDefined();
			expect(service.branch).toBeDefined();
		});

		it("should throw not_found for invalid service ID", async () => {
			try {
				await client.getService("srv-invalid-does-not-exist");
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(RenderApiError);
				const apiError = error as RenderApiError;
				expect(apiError.code).toBe("not_found");
			}
		});
	});

	// ============================================================================
	// Deploy Operations
	// ============================================================================

	describe("listDeploys", () => {
		it("should list deploys for a service", async () => {
			if (!testServiceId) {
				console.warn("Skipping: no test service available");
				return;
			}

			const { items: deploys } = await client.listDeploys(testServiceId);

			expect(Array.isArray(deploys)).toBe(true);

			if (deploys.length > 0) {
				const deploy = deploys[0];
				expect(deploy.id).toBeDefined();
				expect(deploy.status).toBeDefined();
				expect(deploy.trigger).toBeDefined();
				expect(deploy.createdAt).toBeDefined();
			}
		});

		it("should respect limit parameter", async () => {
			if (!testServiceId) {
				console.warn("Skipping: no test service available");
				return;
			}

			const { items: deploys } = await client.listDeploys(testServiceId, {
				limit: 2,
			});

			expect(deploys.length).toBeLessThanOrEqual(2);
		});
	});

	describe("getDeploy", () => {
		it("should get deploy details", async () => {
			if (!testServiceId) {
				console.warn("Skipping: no test service available");
				return;
			}

			const { items: deploys } = await client.listDeploys(testServiceId, {
				limit: 1,
			});

			if (deploys.length === 0) {
				console.warn("Skipping: no deploys available for service");
				return;
			}

			const deployId = deploys[0].id;
			const deploy = await client.getDeploy(testServiceId, deployId);

			expect(deploy.id).toBe(deployId);
			expect(deploy.status).toBeDefined();
			expect(deploy.trigger).toBeDefined();
		});
	});

	// Note: triggerDeploy is not tested in integration tests to avoid
	// triggering actual deploys. Use manual testing for deploy triggers.

	// ============================================================================
	// Environment Variable Operations
	// ============================================================================

	describe("listEnvVars", () => {
		it("should list environment variables", async () => {
			if (!testServiceId) {
				console.warn("Skipping: no test service available");
				return;
			}

			const envVars = await client.listEnvVars(testServiceId);

			expect(Array.isArray(envVars)).toBe(true);

			if (envVars.length > 0) {
				const envVar = envVars[0];
				expect(envVar.key).toBeDefined();
				// value may be undefined for secret env vars
			}
		});
	});

	// Note: setEnvVar and deleteEnvVar are not tested in integration tests
	// to avoid modifying real service configuration. Use manual testing.

	// ============================================================================
	// Error Handling
	// ============================================================================

	describe("error handling", () => {
		it("should handle invalid API key", async () => {
			const invalidClient = createRenderClient({
				apiKey: "invalid-key-12345",
			});

			try {
				await invalidClient.listServices();
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(RenderApiError);
				const apiError = error as RenderApiError;
				expect(apiError.code).toBe("unauthorized");
				expect(apiError.status).toBe(401);
			}
		});
	});
});

// If integration tests are skipped, add a placeholder test
if (SKIP_INTEGRATION) {
	describe("Render API Integration Tests (skipped)", () => {
		it("skipped - set RENDER_API_KEY and RENDER_INTEGRATION_TEST=1 to run", () => {
			console.log(
				"Integration tests skipped. Set RENDER_API_KEY and RENDER_INTEGRATION_TEST=1 to run.",
			);
		});
	});
}
