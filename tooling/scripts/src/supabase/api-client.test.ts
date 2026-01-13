/**
 * Tests for Supabase API client URL construction
 *
 * These tests verify that database connection URLs are properly
 * formatted for use with Prisma, especially handling special
 * characters that could cause P1013 errors.
 */

import { describe, expect, it } from "vitest";
import { createSupabaseClient } from "./api-client.mjs";

describe("getBranchCredentials", () => {
	// Parent project config
	const mockConfig = {
		accessToken: "test-token",
		projectRef: "rhcyfnrwgavrtxkiwzyv", // parent project ref
	};

	const client = createSupabaseClient(mockConfig);

	// Branch project ref (different from parent)
	const branchProjectRef = "abcdefghijklmnopqrst";

	describe("URL encoding", () => {
		it("should encode special characters in password for direct URL", () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "p@$$w0rd#test",
			};

			const credentials = client.getBranchCredentials(branch);

			// Password should be encoded in direct URL
			expect(credentials.directUrl).toContain(
				encodeURIComponent("p@$$w0rd#test"),
			);
			expect(credentials.directUrl).not.toContain("p@$$w0rd#test");
		});

		it("should encode special characters in password for pooler URL", () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "secret#with@special%chars",
			};

			const credentials = client.getBranchCredentials(branch);

			// Password should be encoded in pooler URL
			expect(credentials.poolerUrl).toContain(
				encodeURIComponent("secret#with@special%chars"),
			);
			expect(credentials.poolerUrl).not.toContain(
				"secret#with@special%chars",
			);
		});

		it("should handle password with all URL-sensitive characters", () => {
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

			const credentials = client.getBranchCredentials(branch);
			const encodedPassword = encodeURIComponent("test:/@#?&=+$,;");

			expect(credentials.directUrl).toContain(encodedPassword);
			expect(credentials.poolerUrl).toContain(encodedPassword);
		});

		it("should use branch project_ref in pooler username, not parent projectRef", () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "simplepassword",
			};

			const credentials = client.getBranchCredentials(branch);

			// The username for pooler should be postgres.{branchProjectRef}
			// NOT postgres.{parentProjectRef}
			const url = new URL(credentials.poolerUrl);
			expect(url.username).toBe(`postgres.${branchProjectRef}`);
			expect(url.username).not.toContain(mockConfig.projectRef);
		});
	});

	describe("URL format", () => {
		it("should produce valid PostgreSQL connection URLs", () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			const credentials = client.getBranchCredentials(branch);

			// Both URLs should start with postgresql://
			expect(credentials.directUrl).toMatch(/^postgresql:\/\//);
			expect(credentials.poolerUrl).toMatch(/^postgresql:\/\//);
		});

		it("should include pgbouncer=true in pooler URL", () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			const credentials = client.getBranchCredentials(branch);

			expect(credentials.poolerUrl).toContain("pgbouncer=true");
		});

		it("should use correct ports (6543 for pooler, 5432 for direct)", () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			const credentials = client.getBranchCredentials(branch);

			expect(credentials.directUrl).toContain(":5432/");
			expect(credentials.poolerUrl).toContain(":6543/");
		});

		it("should use branchProjectRef.pooler.supabase.com for pooler host", () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			const credentials = client.getBranchCredentials(branch);

			// Pooler host should use the BRANCH's project_ref, not the parent's
			expect(credentials.poolerUrl).toContain(
				`${branchProjectRef}.pooler.supabase.com`,
			);
			// Should NOT use the parent project's projectRef
			expect(credentials.poolerUrl).not.toContain(
				`${mockConfig.projectRef}.pooler.supabase.com`,
			);
		});

		it("should produce URLs parseable by URL constructor", () => {
			const branch = {
				name: "test-branch",
				status: "ACTIVE_HEALTHY",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "complex#pass@word",
			};

			const credentials = client.getBranchCredentials(branch);

			// Both URLs should be parseable without throwing
			expect(() => new URL(credentials.directUrl)).not.toThrow();
			expect(() => new URL(credentials.poolerUrl)).not.toThrow();
		});

		it("should preserve password when decoded from URL", () => {
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

			const credentials = client.getBranchCredentials(branch);

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

	describe("error handling", () => {
		it("should throw if branch is not ready (missing db_host)", () => {
			const branch = {
				name: "test-branch",
				status: "COMING_UP",
				project_ref: branchProjectRef,
				db_port: 5432,
				db_user: "postgres",
				db_pass: "testpassword",
			};

			expect(() => client.getBranchCredentials(branch)).toThrow(
				/not ready/i,
			);
		});

		it("should throw if branch is not ready (missing db_pass)", () => {
			const branch = {
				name: "test-branch",
				status: "COMING_UP",
				project_ref: branchProjectRef,
				db_host: "db.testref.supabase.co",
				db_port: 5432,
				db_user: "postgres",
			};

			expect(() => client.getBranchCredentials(branch)).toThrow(
				/not ready/i,
			);
		});
	});
});
