import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createRenderClient,
	createRenderClientFromEnv,
	RenderApiError,
} from "./client";
import type {
	DeployResponse,
	RenderDeploy,
	RenderEnvVar,
	RenderService,
	ServiceResponse,
} from "./types";

// ============================================================================
// Mock Fetch Setup
// ============================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
	mockFetch.mockReset();
});

afterEach(() => {
	vi.restoreAllMocks();
});

// ============================================================================
// Test Data
// ============================================================================

const mockService: RenderService = {
	id: "srv-test123",
	autoDeploy: "yes",
	branch: "main",
	createdAt: "2024-01-01T00:00:00Z",
	dashboardUrl: "https://dashboard.render.com/services/srv-test123",
	env: "node",
	name: "test-service",
	notifyOnFail: "default",
	ownerId: "owner-123",
	repo: "https://github.com/example/repo",
	slug: "test-service",
	suspended: "not_suspended",
	type: "web_service",
	updatedAt: "2024-01-02T00:00:00Z",
	serviceDetails: {
		url: "https://test-service.onrender.com",
		region: "oregon",
		plan: "starter",
	},
};

const mockDeploy: RenderDeploy = {
	id: "dep-test123",
	status: "live",
	trigger: "api",
	createdAt: "2024-01-01T00:00:00Z",
	updatedAt: "2024-01-01T00:05:00Z",
	finishedAt: "2024-01-01T00:05:00Z",
	commit: {
		id: "abc123",
		message: "Initial commit",
		createdAt: "2024-01-01T00:00:00Z",
	},
};

const mockEnvVar: RenderEnvVar = {
	key: "API_URL",
	value: "https://api.example.com",
};

// ============================================================================
// Client Creation Tests
// ============================================================================

describe("createRenderClient", () => {
	it("should create a client with required config", () => {
		const client = createRenderClient({ apiKey: "test-api-key" });
		expect(client).toBeDefined();
		expect(client.listServices).toBeDefined();
		expect(client.getService).toBeDefined();
		expect(client.triggerDeploy).toBeDefined();
	});

	it("should throw error if apiKey is not provided", () => {
		expect(() => createRenderClient({ apiKey: "" })).toThrow(
			"Render API key is required",
		);
	});
});

describe("createRenderClientFromEnv", () => {
	it("should create a client from environment variable", () => {
		const originalEnv = process.env.RENDER_API_KEY;
		process.env.RENDER_API_KEY = "test-env-key";

		try {
			const client = createRenderClientFromEnv();
			expect(client).toBeDefined();
		} finally {
			if (originalEnv) {
				process.env.RENDER_API_KEY = originalEnv;
			} else {
				delete process.env.RENDER_API_KEY;
			}
		}
	});

	it("should throw error if RENDER_API_KEY is not set", () => {
		const originalEnv = process.env.RENDER_API_KEY;
		delete process.env.RENDER_API_KEY;

		try {
			expect(() => createRenderClientFromEnv()).toThrow(
				"RENDER_API_KEY environment variable is required",
			);
		} finally {
			if (originalEnv) {
				process.env.RENDER_API_KEY = originalEnv;
			}
		}
	});
});

// ============================================================================
// Service Operations Tests
// ============================================================================

describe("listServices", () => {
	it("should list services", async () => {
		const client = createRenderClient({ apiKey: "test-key" });
		const response: ServiceResponse[] = [{ service: mockService }];

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(JSON.stringify(response)),
		});

		const result = await client.listServices();

		expect(result.items).toHaveLength(1);
		expect(result.items[0].id).toBe("srv-test123");
		expect(result.items[0].name).toBe("test-service");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services",
			expect.objectContaining({
				headers: expect.objectContaining({
					Authorization: "Bearer test-key",
				}),
			}),
		);
	});

	it("should pass filters as query parameters", async () => {
		const client = createRenderClient({ apiKey: "test-key" });

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve("[]"),
		});

		await client.listServices({
			name: "test",
			type: "web_service",
			limit: 10,
		});

		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("name=test"),
			expect.anything(),
		);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("type=web_service"),
			expect.anything(),
		);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("limit=10"),
			expect.anything(),
		);
	});
});

describe("getService", () => {
	it("should get service details", async () => {
		const client = createRenderClient({ apiKey: "test-key" });
		const response: ServiceResponse = { service: mockService };

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(JSON.stringify(response)),
		});

		const result = await client.getService("srv-test123");

		expect(result.id).toBe("srv-test123");
		expect(result.name).toBe("test-service");
		expect(result.serviceDetails?.url).toBe(
			"https://test-service.onrender.com",
		);

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services/srv-test123",
			expect.anything(),
		);
	});
});

// ============================================================================
// Deploy Operations Tests
// ============================================================================

describe("listDeploys", () => {
	it("should list deploys for a service", async () => {
		const client = createRenderClient({ apiKey: "test-key" });
		const response: DeployResponse[] = [{ deploy: mockDeploy }];

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(JSON.stringify(response)),
		});

		const result = await client.listDeploys("srv-test123");

		expect(result.items).toHaveLength(1);
		expect(result.items[0].id).toBe("dep-test123");
		expect(result.items[0].status).toBe("live");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services/srv-test123/deploys",
			expect.anything(),
		);
	});
});

describe("getDeploy", () => {
	it("should get deploy details", async () => {
		const client = createRenderClient({ apiKey: "test-key" });
		const response: DeployResponse = { deploy: mockDeploy };

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(JSON.stringify(response)),
		});

		const result = await client.getDeploy("srv-test123", "dep-test123");

		expect(result.id).toBe("dep-test123");
		expect(result.status).toBe("live");
		expect(result.commit?.message).toBe("Initial commit");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services/srv-test123/deploys/dep-test123",
			expect.anything(),
		);
	});
});

describe("triggerDeploy", () => {
	it("should trigger a deploy", async () => {
		const client = createRenderClient({ apiKey: "test-key" });
		const response: DeployResponse = {
			deploy: { ...mockDeploy, status: "created" },
		};

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(JSON.stringify(response)),
		});

		const result = await client.triggerDeploy("srv-test123");

		expect(result.status).toBe("created");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services/srv-test123/deploys",
			expect.objectContaining({
				method: "POST",
			}),
		);
	});

	it("should pass clearCache option", async () => {
		const client = createRenderClient({ apiKey: "test-key" });
		const response: DeployResponse = {
			deploy: { ...mockDeploy, status: "created" },
		};

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(JSON.stringify(response)),
		});

		await client.triggerDeploy("srv-test123", { clearCache: true });

		expect(mockFetch).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				body: JSON.stringify({ clearCache: "clear" }),
			}),
		);
	});
});

describe("cancelDeploy", () => {
	it("should cancel a deploy", async () => {
		const client = createRenderClient({ apiKey: "test-key" });
		const response: DeployResponse = {
			deploy: { ...mockDeploy, status: "canceled" },
		};

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(JSON.stringify(response)),
		});

		const result = await client.cancelDeploy("srv-test123", "dep-test123");

		expect(result.status).toBe("canceled");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services/srv-test123/deploys/dep-test123/cancel",
			expect.objectContaining({
				method: "POST",
			}),
		);
	});
});

// ============================================================================
// Environment Variable Operations Tests
// ============================================================================

describe("listEnvVars", () => {
	it("should list environment variables", async () => {
		const client = createRenderClient({ apiKey: "test-key" });
		const response = [{ envVar: mockEnvVar }];

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(JSON.stringify(response)),
		});

		const result = await client.listEnvVars("srv-test123");

		expect(result).toHaveLength(1);
		expect(result[0].key).toBe("API_URL");
		expect(result[0].value).toBe("https://api.example.com");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services/srv-test123/env-vars",
			expect.anything(),
		);
	});
});

describe("getEnvVar", () => {
	it("should get a specific environment variable", async () => {
		const client = createRenderClient({ apiKey: "test-key" });
		const response = { envVar: mockEnvVar };

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(JSON.stringify(response)),
		});

		const result = await client.getEnvVar("srv-test123", "API_URL");

		expect(result.key).toBe("API_URL");
		expect(result.value).toBe("https://api.example.com");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services/srv-test123/env-vars/API_URL",
			expect.anything(),
		);
	});

	it("should URL-encode special characters in key", async () => {
		const client = createRenderClient({ apiKey: "test-key" });

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () =>
				Promise.resolve(JSON.stringify({ envVar: { key: "MY/VAR" } })),
		});

		await client.getEnvVar("srv-test123", "MY/VAR");

		expect(mockFetch).toHaveBeenCalledWith(
			expect.stringContaining("MY%2FVAR"),
			expect.anything(),
		);
	});
});

describe("setEnvVar", () => {
	it("should set an environment variable", async () => {
		const client = createRenderClient({ apiKey: "test-key" });

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(""),
		});

		await client.setEnvVar("srv-test123", {
			key: "NEW_VAR",
			value: "new-value",
		});

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services/srv-test123/env-vars/NEW_VAR",
			expect.objectContaining({
				method: "PUT",
				body: JSON.stringify({ value: "new-value" }),
			}),
		);
	});
});

describe("deleteEnvVar", () => {
	it("should delete an environment variable", async () => {
		const client = createRenderClient({ apiKey: "test-key" });

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 204,
			text: () => Promise.resolve(""),
		});

		await client.deleteEnvVar("srv-test123", "OLD_VAR");

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services/srv-test123/env-vars/OLD_VAR",
			expect.objectContaining({
				method: "DELETE",
			}),
		);
	});
});

describe("setEnvVars", () => {
	it("should set multiple environment variables", async () => {
		const client = createRenderClient({ apiKey: "test-key" });

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve(""),
		});

		await client.setEnvVars("srv-test123", [
			{ key: "VAR1", value: "value1" },
			{ key: "VAR2", value: "value2" },
		]);

		expect(mockFetch).toHaveBeenCalledWith(
			"https://api.render.com/v1/services/srv-test123/env-vars",
			expect.objectContaining({
				method: "PUT",
				body: JSON.stringify([
					{ key: "VAR1", value: "value1" },
					{ key: "VAR2", value: "value2" },
				]),
			}),
		);
	});
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe("error handling", () => {
	it("should throw RenderApiError for 401 Unauthorized", async () => {
		const client = createRenderClient({ apiKey: "invalid-key" });

		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: () => Promise.resolve({ message: "Invalid API key" }),
		});

		try {
			await client.listServices();
			expect.fail("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(RenderApiError);
			expect((error as RenderApiError).code).toBe("unauthorized");
		}
	});

	it("should throw RenderApiError for 404 Not Found", async () => {
		const client = createRenderClient({ apiKey: "test-key" });

		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 404,
			json: () => Promise.resolve({ message: "Service not found" }),
		});

		try {
			await client.getService("srv-invalid");
			expect.fail("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(RenderApiError);
			expect((error as RenderApiError).code).toBe("not_found");
		}
	});

	it("should throw RenderApiError for 429 Rate Limited", async () => {
		const client = createRenderClient({ apiKey: "test-key" });

		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 429,
			json: () => Promise.resolve({ message: "Rate limit exceeded" }),
		});

		try {
			await client.listServices();
			expect.fail("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(RenderApiError);
			expect((error as RenderApiError).code).toBe("rate_limited");
		}
	});

	it("should throw RenderApiError for 500 Server Error", async () => {
		const client = createRenderClient({ apiKey: "test-key" });

		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			json: () => Promise.resolve({ message: "Internal server error" }),
		});

		try {
			await client.listServices();
			expect.fail("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(RenderApiError);
			expect((error as RenderApiError).code).toBe("server_error");
		}
	});

	it("should handle network errors", async () => {
		const client = createRenderClient({ apiKey: "test-key" });

		mockFetch.mockRejectedValueOnce(new Error("Network error"));

		try {
			await client.listServices();
			expect.fail("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(RenderApiError);
			expect((error as RenderApiError).code).toBe("network_error");
		}
	});

	it("should include status and details in error", async () => {
		const client = createRenderClient({ apiKey: "test-key" });

		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 400,
			json: () =>
				Promise.resolve({
					message: "Validation failed",
					errors: [{ field: "name", message: "required" }],
				}),
		});

		try {
			await client.listServices();
			expect.fail("Should have thrown");
		} catch (error) {
			expect(error).toBeInstanceOf(RenderApiError);
			const apiError = error as RenderApiError;
			expect(apiError.status).toBe(400);
			expect(apiError.code).toBe("validation_error");
			expect(apiError.details).toBeDefined();
		}
	});
});

// ============================================================================
// Configuration Tests
// ============================================================================

describe("client configuration", () => {
	it("should use custom base URL", async () => {
		const client = createRenderClient({
			apiKey: "test-key",
			baseUrl: "https://custom.api.render.com/v2",
		});

		mockFetch.mockResolvedValueOnce({
			ok: true,
			status: 200,
			text: () => Promise.resolve("[]"),
		});

		await client.listServices();

		expect(mockFetch).toHaveBeenCalledWith(
			"https://custom.api.render.com/v2/services",
			expect.anything(),
		);
	});
});
