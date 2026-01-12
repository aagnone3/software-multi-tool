import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetExternalServicesMocks } from "../../tests/fixtures/external-services";

const mockGenerateOpenApi = vi.fn(async () => ({
	paths: {
		"/session": {
			get: {},
		},
	},
}));

vi.mock("@repo/auth", () => ({
	auth: {
		handler: vi.fn(() => new Response(null, { status: 204 })),
		api: {
			generateOpenAPISchema: mockGenerateOpenApi,
		},
	},
}));

const mockLog = vi.fn();

vi.mock("@repo/logs", () => ({
	logger: {
		log: mockLog,
		error: mockLog,
	},
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://example.com",
}));

vi.mock("@repo/payments", async () => {
	const { mockPaymentsModule } = await import(
		"../../tests/fixtures/external-services"
	);
	return mockPaymentsModule();
});

vi.mock("@scalar/hono-api-reference", () => ({
	Scalar: () => async (_c: any, next: () => Promise<void>) => {
		await next();
	},
}));

vi.mock("@orpc/openapi", () => ({
	OpenAPIGenerator: class {
		async generate() {
			return {
				paths: {
					"/info": {
						get: {},
					},
				},
			};
		}
	},
}));

vi.mock("@orpc/zod/zod4", () => ({
	ZodToJsonSchemaConverter: class {},
}));

vi.mock("hono/logger", () => ({
	logger: () => async (_c: any, next: () => Promise<void>) => {
		await next();
	},
}));

vi.mock("hono/cors", () => ({
	cors: () => async (_c: any, next: () => Promise<void>) => {
		await next();
	},
}));

vi.mock("./orpc/handler", () => ({
	openApiHandler: {
		handle: vi.fn(async () => ({
			matched: false,
			response: new Response(),
		})),
	},
	rpcHandler: {
		handle: vi.fn(async () => ({
			matched: false,
			response: new Response(),
		})),
	},
}));

vi.mock("./orpc/router", () => ({
	router: {},
}));

describe("api app", () => {
	beforeEach(() => {
		resetExternalServicesMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("responds to /api/health requests", async () => {
		const { app } = await import("./index");

		const res = await app.request("/api/health");

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("OK");
	}, 30000);

	it("exposes merged OpenAPI schema with base URL server entry", async () => {
		const { app } = await import("./index");

		const res = await app.request("/api/openapi");
		expect(res.status).toBe(200);
		const body = await res.json();

		expect(body.paths["/info"]).toBeDefined();
		expect(mockGenerateOpenApi).toHaveBeenCalledTimes(1);
	}, 30000);
});
