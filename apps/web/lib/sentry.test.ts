import * as Sentry from "@sentry/nextjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	captureException,
	captureMessage,
	setSentryContextFromSession,
	setSentryOrganizationContext,
	setSentryUserContext,
} from "./sentry";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
	setUser: vi.fn(),
	setTag: vi.fn(),
	setContext: vi.fn(),
	captureException: vi.fn(),
	captureMessage: vi.fn(),
}));

describe("sentry utilities", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("setSentryUserContext", () => {
		it("should set user context with all fields", () => {
			const user = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
				username: "testuser",
			};

			setSentryUserContext(user);

			expect(Sentry.setUser).toHaveBeenCalledWith({
				id: "user-123",
				email: "test@example.com",
				username: "testuser",
			});
		});

		it("should use name as fallback for username", () => {
			const user = {
				id: "user-123",
				email: "test@example.com",
				name: "Test User",
			};

			setSentryUserContext(user);

			expect(Sentry.setUser).toHaveBeenCalledWith({
				id: "user-123",
				email: "test@example.com",
				username: "Test User",
			});
		});

		it("should clear user context when null", () => {
			setSentryUserContext(null);

			expect(Sentry.setUser).toHaveBeenCalledWith(null);
		});
	});

	describe("setSentryOrganizationContext", () => {
		it("should set organization tags with all fields", () => {
			const organization = {
				id: "org-123",
				name: "Test Org",
				slug: "test-org",
			};

			setSentryOrganizationContext(organization);

			expect(Sentry.setTag).toHaveBeenCalledWith(
				"organization.id",
				"org-123",
			);
			expect(Sentry.setTag).toHaveBeenCalledWith(
				"organization.name",
				"Test Org",
			);
			expect(Sentry.setTag).toHaveBeenCalledWith(
				"organization.slug",
				"test-org",
			);
		});

		it("should set only required fields", () => {
			const organization = {
				id: "org-123",
			};

			setSentryOrganizationContext(organization);

			expect(Sentry.setTag).toHaveBeenCalledWith(
				"organization.id",
				"org-123",
			);
			expect(Sentry.setTag).toHaveBeenCalledTimes(1);
		});

		it("should clear organization tags when null", () => {
			setSentryOrganizationContext(null);

			expect(Sentry.setTag).toHaveBeenCalledWith(
				"organization.id",
				undefined,
			);
			expect(Sentry.setTag).toHaveBeenCalledWith(
				"organization.name",
				undefined,
			);
			expect(Sentry.setTag).toHaveBeenCalledWith(
				"organization.slug",
				undefined,
			);
		});
	});

	describe("setSentryContextFromSession", () => {
		it("should set user context from session", () => {
			// Use minimal mock to avoid type issues
			const session = {
				user: {
					id: "user-123",
					email: "test@example.com",
					name: "Test User",
				},
			} as any;

			setSentryContextFromSession(session);

			expect(Sentry.setUser).toHaveBeenCalledWith({
				id: "user-123",
				email: "test@example.com",
				username: "Test User",
			});
		});

		it("should clear context when session is null", () => {
			setSentryContextFromSession(null);

			expect(Sentry.setUser).toHaveBeenCalledWith(null);
		});
	});

	describe("captureException", () => {
		it("should capture exception without context", () => {
			const error = new Error("Test error");

			captureException(error);

			expect(Sentry.captureException).toHaveBeenCalledWith(error);
		});

		it("should capture exception with context", () => {
			const error = new Error("Test error");
			const context = { foo: "bar", baz: 123 };

			captureException(error, context);

			expect(Sentry.setContext).toHaveBeenCalledWith(
				"additional_context",
				context,
			);
			expect(Sentry.captureException).toHaveBeenCalledWith(error);
		});
	});

	describe("captureMessage", () => {
		it("should capture message with default level", () => {
			captureMessage("Test message");

			expect(Sentry.captureMessage).toHaveBeenCalledWith(
				"Test message",
				"info",
			);
		});

		it("should capture message with custom level", () => {
			captureMessage("Test error", "error");

			expect(Sentry.captureMessage).toHaveBeenCalledWith(
				"Test error",
				"error",
			);
		});
	});
});
