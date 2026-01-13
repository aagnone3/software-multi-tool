import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
	buildCheckRunBody,
	buildCheckRunUpdateBody,
	createGitHubCheck,
	getCheckName,
	getRenderDashboardUrl,
	githubRequest,
	isGitHubCheckEnabled,
	updateGitHubCheck,
} from "./github-checks.mjs";

describe("github-checks", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		// Reset environment before each test
		process.env = { ...originalEnv };
		vi.clearAllMocks();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("isGitHubCheckEnabled", () => {
		it("returns true when both GITHUB_TOKEN and GITHUB_REPOSITORY are set", () => {
			process.env.GITHUB_TOKEN = "test-token";
			process.env.GITHUB_REPOSITORY = "owner/repo";

			expect(isGitHubCheckEnabled()).toBe(true);
		});

		it("returns false when GITHUB_TOKEN is missing", () => {
			delete process.env.GITHUB_TOKEN;
			process.env.GITHUB_REPOSITORY = "owner/repo";

			expect(isGitHubCheckEnabled()).toBe(false);
		});

		it("returns false when GITHUB_REPOSITORY is missing", () => {
			process.env.GITHUB_TOKEN = "test-token";
			delete process.env.GITHUB_REPOSITORY;

			expect(isGitHubCheckEnabled()).toBe(false);
		});

		it("returns false when both are missing", () => {
			delete process.env.GITHUB_TOKEN;
			delete process.env.GITHUB_REPOSITORY;

			expect(isGitHubCheckEnabled()).toBe(false);
		});
	});

	describe("getCheckName", () => {
		it("returns the correct check name", () => {
			expect(getCheckName()).toBe("Render Preview");
		});
	});

	describe("buildCheckRunBody", () => {
		it("builds basic check run body with required fields", () => {
			const body = buildCheckRunBody("abc123", "in_progress");

			expect(body.name).toBe("Render Preview");
			expect(body.head_sha).toBe("abc123");
			expect(body.status).toBe("in_progress");
			expect(body.started_at).toBeDefined();
		});

		it("includes details_url when provided", () => {
			const body = buildCheckRunBody("abc123", "in_progress", {
				detailsUrl: "https://example.com",
			});

			expect(body.details_url).toBe("https://example.com");
		});

		it("includes conclusion and completed_at for completed status", () => {
			const body = buildCheckRunBody("abc123", "completed", {
				conclusion: "success",
			});

			expect(body.conclusion).toBe("success");
			expect(body.completed_at).toBeDefined();
		});

		it("does not include conclusion for non-completed status", () => {
			const body = buildCheckRunBody("abc123", "in_progress", {
				conclusion: "success", // Should be ignored
			});

			expect(body.conclusion).toBeUndefined();
			expect(body.completed_at).toBeUndefined();
		});

		it("includes output when summary is provided", () => {
			const body = buildCheckRunBody("abc123", "in_progress", {
				summary: "Test summary",
			});

			expect(body.output).toEqual({
				title: "Render Preview",
				summary: "Test summary",
				text: "",
			});
		});

		it("includes output when text is provided", () => {
			const body = buildCheckRunBody("abc123", "in_progress", {
				text: "Test text",
			});

			expect(body.output).toEqual({
				title: "Render Preview",
				summary: "",
				text: "Test text",
			});
		});

		it("includes both summary and text in output", () => {
			const body = buildCheckRunBody("abc123", "completed", {
				conclusion: "success",
				summary: "Test summary",
				text: "Test text",
			});

			expect(body.output).toEqual({
				title: "Render Preview",
				summary: "Test summary",
				text: "Test text",
			});
		});
	});

	describe("buildCheckRunUpdateBody", () => {
		it("builds basic update body with status", () => {
			const body = buildCheckRunUpdateBody("in_progress");

			expect(body.status).toBe("in_progress");
			expect(body.name).toBeUndefined(); // Update doesn't include name
			expect(body.head_sha).toBeUndefined(); // Update doesn't include sha
		});

		it("includes details_url when provided", () => {
			const body = buildCheckRunUpdateBody("in_progress", {
				detailsUrl: "https://example.com",
			});

			expect(body.details_url).toBe("https://example.com");
		});

		it("includes conclusion and completed_at for completed status", () => {
			const body = buildCheckRunUpdateBody("completed", {
				conclusion: "failure",
			});

			expect(body.conclusion).toBe("failure");
			expect(body.completed_at).toBeDefined();
		});

		it("includes output when provided", () => {
			const body = buildCheckRunUpdateBody("completed", {
				conclusion: "success",
				summary: "Deployment ready",
				text: "Preview URL: https://preview.example.com",
			});

			expect(body.output).toEqual({
				title: "Render Preview",
				summary: "Deployment ready",
				text: "Preview URL: https://preview.example.com",
			});
		});
	});

	describe("getRenderDashboardUrl", () => {
		it("returns dashboardUrl if available", () => {
			const service = {
				id: "srv-123",
				dashboardUrl: "https://dashboard.render.com/web/srv-123/events",
			};

			expect(getRenderDashboardUrl(service)).toBe(
				"https://dashboard.render.com/web/srv-123/events",
			);
		});

		it("constructs URL from id if dashboardUrl not available", () => {
			const service = {
				id: "srv-456",
			};

			expect(getRenderDashboardUrl(service)).toBe(
				"https://dashboard.render.com/web/srv-456",
			);
		});

		it("returns default dashboard URL if no service info", () => {
			expect(getRenderDashboardUrl(null)).toBe(
				"https://dashboard.render.com",
			);
			expect(getRenderDashboardUrl(undefined)).toBe(
				"https://dashboard.render.com",
			);
			expect(getRenderDashboardUrl({})).toBe(
				"https://dashboard.render.com",
			);
		});
	});

	describe("githubRequest", () => {
		it("throws error when GITHUB_TOKEN is not set", async () => {
			delete process.env.GITHUB_TOKEN;

			await expect(githubRequest("/test")).rejects.toThrow(
				"GITHUB_TOKEN environment variable is required",
			);
		});

		it("makes request with correct headers", async () => {
			process.env.GITHUB_TOKEN = "test-token";

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ data: "test" }),
			});

			const result = await githubRequest("/test", {}, mockFetch);

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.github.com/test",
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: "Bearer test-token",
						Accept: "application/vnd.github+json",
						"X-GitHub-Api-Version": "2022-11-28",
						"Content-Type": "application/json",
					}),
				}),
			);
			expect(result).toEqual({ data: "test" });
		});

		it("returns null for 204 responses", async () => {
			process.env.GITHUB_TOKEN = "test-token";

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 204,
			});

			const result = await githubRequest("/test", {}, mockFetch);

			expect(result).toBeNull();
		});

		it("throws error with message from response body", async () => {
			process.env.GITHUB_TOKEN = "test-token";

			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 403,
				statusText: "Forbidden",
				json: () =>
					Promise.resolve({ message: "Resource not accessible" }),
			});

			await expect(githubRequest("/test", {}, mockFetch)).rejects.toThrow(
				"GitHub API error: Resource not accessible",
			);
		});

		it("throws generic error when response body cannot be parsed", async () => {
			process.env.GITHUB_TOKEN = "test-token";

			const mockFetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				json: () => Promise.reject(new Error("Not JSON")),
			});

			await expect(githubRequest("/test", {}, mockFetch)).rejects.toThrow(
				"GitHub API error: 500 Internal Server Error",
			);
		});
	});

	describe("createGitHubCheck", () => {
		it("throws error when GITHUB_REPOSITORY is not set", async () => {
			process.env.GITHUB_TOKEN = "test-token";
			delete process.env.GITHUB_REPOSITORY;

			await expect(
				createGitHubCheck("abc123", "in_progress"),
			).rejects.toThrow(
				"GITHUB_REPOSITORY environment variable is required",
			);
		});

		it("creates check run and returns id", async () => {
			process.env.GITHUB_TOKEN = "test-token";
			process.env.GITHUB_REPOSITORY = "owner/repo";

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 201,
				json: () => Promise.resolve({ id: 12345 }),
			});

			const result = await createGitHubCheck(
				"abc123",
				"in_progress",
				{
					summary: "Starting deployment",
				},
				mockFetch,
			);

			expect(result).toEqual({ id: 12345 });
			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.github.com/repos/owner/repo/check-runs",
				expect.objectContaining({
					method: "POST",
					body: expect.stringContaining('"head_sha":"abc123"'),
				}),
			);
		});
	});

	describe("updateGitHubCheck", () => {
		it("throws error when GITHUB_REPOSITORY is not set", async () => {
			process.env.GITHUB_TOKEN = "test-token";
			delete process.env.GITHUB_REPOSITORY;

			await expect(updateGitHubCheck(12345, "completed")).rejects.toThrow(
				"GITHUB_REPOSITORY environment variable is required",
			);
		});

		it("updates check run with correct endpoint", async () => {
			process.env.GITHUB_TOKEN = "test-token";
			process.env.GITHUB_REPOSITORY = "owner/repo";

			const mockFetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				json: () => Promise.resolve({ id: 12345 }),
			});

			await updateGitHubCheck(
				12345,
				"completed",
				{
					conclusion: "success",
					summary: "Deployment ready",
					detailsUrl: "https://preview.example.com",
				},
				mockFetch,
			);

			expect(mockFetch).toHaveBeenCalledWith(
				"https://api.github.com/repos/owner/repo/check-runs/12345",
				expect.objectContaining({
					method: "PATCH",
					body: expect.stringContaining('"status":"completed"'),
				}),
			);

			// Verify request body contains expected fields
			const callArgs = mockFetch.mock.calls[0];
			const requestBody = JSON.parse(callArgs[1].body);
			expect(requestBody.conclusion).toBe("success");
			expect(requestBody.details_url).toBe("https://preview.example.com");
			expect(requestBody.output.summary).toBe("Deployment ready");
		});
	});
});
