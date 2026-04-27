import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Set env vars before import
process.env.NEON_API_KEY = "test-api-key";
process.env.NEON_PROJECT_ID = "test-project-123";

const { createNeonClient, createNeonClientFromEnv } = await import(
	"./api-client.mjs"
);

describe("Neon API Client", () => {
	beforeEach(() => {
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("createNeonClient", () => {
		it("throws if apiKey is missing", () => {
			expect(() =>
				createNeonClient({ apiKey: "", projectId: "proj" }),
			).toThrow("NEON_API_KEY is required");
		});

		it("throws if projectId is missing", () => {
			expect(() =>
				createNeonClient({ apiKey: "key", projectId: "" }),
			).toThrow("NEON_PROJECT_ID is required");
		});
	});

	describe("createNeonClientFromEnv", () => {
		it("creates client from environment variables", () => {
			const client = createNeonClientFromEnv();
			expect(client).toBeDefined();
			expect(client.listBranches).toBeTypeOf("function");
			expect(client.findBranchByName).toBeTypeOf("function");
			expect(client.getBranchCredentials).toBeTypeOf("function");
			expect(client.isBranchReady).toBeTypeOf("function");
			expect(client.waitForBranch).toBeTypeOf("function");
		});
	});

	describe("isBranchReady", () => {
		const client = createNeonClient({
			apiKey: "test-key",
			projectId: "test-project",
		});

		it("returns true when current_state is ready", () => {
			expect(client.isBranchReady({ current_state: "ready" })).toBe(true);
		});

		it("returns false when current_state is init", () => {
			expect(client.isBranchReady({ current_state: "init" })).toBe(false);
		});

		it("returns false when current_state is undefined", () => {
			expect(client.isBranchReady({})).toBe(false);
		});
	});

	describe("findBranchByName", () => {
		const client = createNeonClient({
			apiKey: "test-key",
			projectId: "test-project",
		});

		it("searches for preview/{gitBranch} and returns exact match", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					branches: [
						{
							id: "br-abc",
							name: "preview/feat/my-feature",
							current_state: "ready",
						},
						{
							id: "br-def",
							name: "preview/feat/my-feature-2",
							current_state: "ready",
						},
					],
				}),
			});

			const branch = await client.findBranchByName("feat/my-feature");

			expect(branch).toEqual({
				id: "br-abc",
				name: "preview/feat/my-feature",
				current_state: "ready",
			});

			// Verify the search query
			const calledUrl = mockFetch.mock.calls[0][0];
			expect(calledUrl).toContain("search=preview%2Ffeat%2Fmy-feature");
		});

		it("returns null when no match found", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ branches: [] }),
			});

			const branch = await client.findBranchByName("nonexistent");
			expect(branch).toBeNull();
		});
	});

	describe("getBranchCredentials", () => {
		const client = createNeonClient({
			apiKey: "test-key",
			projectId: "test-project",
		});

		it("throws if branch is not ready", async () => {
			await expect(
				client.getBranchCredentials({
					id: "br-abc",
					name: "preview/test",
					current_state: "init",
				}),
			).rejects.toThrow("not ready");
		});

		it("returns poolerUrl and directUrl", async () => {
			// Mock roles endpoint
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					roles: [{ name: "neondb_owner" }],
				}),
			});

			// Mock databases endpoint
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					databases: [{ name: "neondb" }],
				}),
			});

			// Mock pooled connection_uri
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					uri: "postgresql://neondb_owner:pass@ep-test-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
				}),
			});

			// Mock direct connection_uri
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					uri: "postgresql://neondb_owner:pass@ep-test.us-east-1.aws.neon.tech/neondb?sslmode=require",
				}),
			});

			const creds = await client.getBranchCredentials({
				id: "br-abc",
				name: "preview/test",
				current_state: "ready",
			});

			expect(creds.poolerUrl).toContain("pooler");
			expect(creds.directUrl).not.toContain("pooler");
			expect(creds.poolerUrl).toMatch(/^postgresql:\/\//);
			expect(creds.directUrl).toMatch(/^postgresql:\/\//);
		});

		it("fetches roles and databases for the branch", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					roles: [{ name: "web_access" }, { name: "neondb_owner" }],
				}),
			});
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					databases: [{ name: "neondb" }],
				}),
			});
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ uri: "postgresql://pooled" }),
			});
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({ uri: "postgresql://direct" }),
			});

			await client.getBranchCredentials({
				id: "br-abc",
				name: "preview/test",
				current_state: "ready",
			});

			// Should skip web_access role and use neondb_owner
			const connectionUriCall = mockFetch.mock.calls[2][0];
			expect(connectionUriCall).toContain("role_name=neondb_owner");
			expect(connectionUriCall).toContain("database_name=neondb");
		});
	});

	describe("listBranches", () => {
		const client = createNeonClient({
			apiKey: "test-key",
			projectId: "test-project",
		});

		it("returns array of branches", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => ({
					branches: [
						{ id: "br-main", name: "main" },
						{ id: "br-preview", name: "preview/feat/test" },
					],
				}),
			});

			const branches = await client.listBranches();
			expect(branches).toHaveLength(2);
			expect(branches[0].id).toBe("br-main");
		});
	});

	describe("retry logic", () => {
		const client = createNeonClient({
			apiKey: "test-key",
			projectId: "test-project",
		});

		it("retries on 429 errors", async () => {
			mockFetch
				.mockResolvedValueOnce({
					ok: false,
					status: 429,
					statusText: "Too Many Requests",
					json: async () => ({ message: "429 rate limited" }),
				})
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ branches: [] }),
				});

			const branches = await client.listBranches();
			expect(branches).toEqual([]);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
	});
});
