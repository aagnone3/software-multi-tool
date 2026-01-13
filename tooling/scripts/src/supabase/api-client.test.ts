/**
 * Tests for Supabase API client URL construction
 *
 * These tests verify that database connection URLs are properly
 * formatted for use with Prisma, especially handling special
 * characters that could cause P1013 errors.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseClient } from "./api-client.mjs";

describe("getBranchCredentials", () => {
	// Parent project config
	const mockConfig = {
		accessToken: "test-token",
		projectRef: "rhcyfnrwgavrtxkiwzyv", // parent project ref
	};

	// Branch project ref (different from parent)
	const branchProjectRef = "abcdefghijklmnopqrst";

	// Mock project region
	const mockRegion = "us-east-1";

	// Mock pooler config returned by API
	const mockPoolerConfig = [
		{
			db_port: 6543,
			pool_mode: "transaction",
			db_host: `aws-0-${mockRegion}.pooler.supabase.com`,
			db_user: "postgres",
			db_name: "postgres",
			connectionString: `postgres://postgres.${branchProjectRef}@aws-0-${mockRegion}.pooler.supabase.com:6543/postgres`,
		},
	];

	// Mock project details
	const mockProject = {
		id: "test-project-id",
		region: mockRegion,
	};

	let client: ReturnType<typeof createSupabaseClient>;
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Mock global fetch
		mockFetch = vi.fn();
		global.fetch = mockFetch;

		// Default: pooler config API returns successfully
		mockFetch.mockImplementation(async (url: string) => {
			if (url.includes("/config/database/pooler")) {
				return {
					ok: true,
					status: 200,
					json: async () => mockPoolerConfig,
				};
			}
			if (url.includes(`/projects/${mockConfig.projectRef}`)) {
				return {
					ok: true,
					status: 200,
					json: async () => mockProject,
				};
			}
			return {
				ok: false,
				status: 404,
				statusText: "Not Found",
				json: async () => ({ message: "Not found" }),
			};
		});

		client = createSupabaseClient(mockConfig);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("URL encoding", () => {
		it("should encode special characters in password for direct URL", async () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "p@$$w0rd#test",
			};

			const credentials = await client.getBranchCredentials(branch);

			// Password should be encoded in direct URL
			expect(credentials.directUrl).toContain(
				encodeURIComponent("p@$$w0rd#test"),
			);
			expect(credentials.directUrl).not.toContain("p@$$w0rd#test");
		});

		it("should encode special characters in password for pooler URL", async () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "secret#with@special%chars",
			};

			const credentials = await client.getBranchCredentials(branch);

			// Password should be encoded in pooler URL
			expect(credentials.poolerUrl).toContain(
				encodeURIComponent("secret#with@special%chars"),
			);
			expect(credentials.poolerUrl).not.toContain(
				"secret#with@special%chars",
			);
		});

		it("should handle password with all URL-sensitive characters", async () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				// All characters that need encoding in URLs
				db_pass: "test:/@#?&=+$,;",
			};

			const credentials = await client.getBranchCredentials(branch);
			const encodedPassword = encodeURIComponent("test:/@#?&=+$,;");

			expect(credentials.directUrl).toContain(encodedPassword);
			expect(credentials.poolerUrl).toContain(encodedPassword);
		});

		it("should use branch project_ref in pooler username, not parent projectRef", async () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "simplepassword",
			};

			const credentials = await client.getBranchCredentials(branch);

			// The username for pooler should be postgres.{branchProjectRef}
			// NOT postgres.{parentProjectRef}
			const url = new URL(credentials.poolerUrl);
			expect(url.username).toBe(`postgres.${branchProjectRef}`);
			expect(url.username).not.toContain(mockConfig.projectRef);
		});
	});

	describe("URL format", () => {
		it("should produce valid PostgreSQL connection URLs", async () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			const credentials = await client.getBranchCredentials(branch);

			// Both URLs should start with postgresql:// or postgres://
			expect(credentials.directUrl).toMatch(/^postgres(ql)?:\/\//);
			expect(credentials.poolerUrl).toMatch(/^postgres(ql)?:\/\//);
		});

		it("should include pgbouncer=true in pooler URL", async () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			const credentials = await client.getBranchCredentials(branch);

			expect(credentials.poolerUrl).toContain("pgbouncer=true");
		});

		it("should use correct ports (6543 for pooler, 5432 for direct)", async () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			const credentials = await client.getBranchCredentials(branch);

			expect(credentials.directUrl).toContain(":5432/");
			expect(credentials.poolerUrl).toContain(":6543/");
		});

		it("should use regional pooler host from API", async () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			const credentials = await client.getBranchCredentials(branch);

			// Pooler host should use the regional format from API
			expect(credentials.poolerUrl).toContain(
				`aws-0-${mockRegion}.pooler.supabase.com`,
			);
		});

		it("should produce URLs parseable by URL constructor", async () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "complex#pass@word",
			};

			const credentials = await client.getBranchCredentials(branch);

			// Both URLs should be parseable without throwing
			expect(() => new URL(credentials.directUrl)).not.toThrow();
			expect(() => new URL(credentials.poolerUrl)).not.toThrow();
		});

		it("should preserve password when decoded from URL", async () => {
			const originalPassword = "p@$$w0rd#test&more=stuff";
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: originalPassword,
			};

			const credentials = await client.getBranchCredentials(branch);

			// Parse the URL and verify the password can be decoded back
			// Note: URL.password returns the encoded value, so we need to decode it
			const directUrl = new URL(credentials.directUrl);
			const poolerUrl = new URL(credentials.poolerUrl);

			expect(decodeURIComponent(directUrl.password)).toBe(
				originalPassword,
			);
			expect(decodeURIComponent(poolerUrl.password)).toBe(
				originalPassword,
			);
		});
	});

	describe("API fallback", () => {
		it("should fall back to region-based URL when pooler API fails", async () => {
			// Make pooler config API fail
			mockFetch.mockImplementation(async (url: string) => {
				if (url.includes("/config/database/pooler")) {
					return {
						ok: false,
						status: 404,
						statusText: "Not Found",
						json: async () => ({ message: "Not found" }),
					};
				}
				if (url.includes(`/projects/${mockConfig.projectRef}`)) {
					return {
						ok: true,
						status: 200,
						json: async () => mockProject,
					};
				}
				return {
					ok: false,
					status: 404,
					statusText: "Not Found",
					json: async () => ({ message: "Not found" }),
				};
			});

			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			const credentials = await client.getBranchCredentials(branch);

			// Should still produce valid URLs using the fallback (parent project region)
			expect(credentials.poolerUrl).toContain(
				`aws-0-${mockRegion}.pooler.supabase.com`,
			);
			expect(credentials.poolerUrl).toContain(
				`postgres.${branchProjectRef}`,
			);
		});
	});

	describe("error handling", () => {
		it("should throw if branch is not ready (missing db_host)", async () => {
			const branch = {
				name: "test-branch",
				status: "COMING_UP",
				project_ref: branchProjectRef,
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			await expect(client.getBranchCredentials(branch)).rejects.toThrow(
				/not ready/i,
			);
		});

		it("should throw if branch is not ready (missing db_pass)", async () => {
			const branch = {
				name: "test-branch",
				status: "COMING_UP",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
			};

			await expect(client.getBranchCredentials(branch)).rejects.toThrow(
				/not ready/i,
			);
		});
	});
});
