import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, getInvitationMock } = vi.hoisted(() => ({
	redirectMock: vi.fn(),
	getInvitationMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: redirectMock,
}));

vi.mock("@saas/auth/lib/server", () => ({
	getInvitation: getInvitationMock,
}));

vi.mock("@saas/auth/components/SignupForm", () => ({
	SignupForm: ({ prefillEmail }: { prefillEmail?: string }) => (
		<div data-testid="signup-form" data-prefill-email={prefillEmail}>
			SignupForm
		</div>
	),
}));

vi.mock("@repo/config", () => ({
	config: {
		auth: {
			enableSignup: true,
		},
	},
}));

vi.mock("ufo", () => ({
	withQuery: (path: string, params: Record<string, string>) =>
		`${path}?${new URLSearchParams(params).toString()}`,
}));

describe("SignupPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders SignupForm when signup is enabled", async () => {
		const { default: SignupPage } = await import("./page");
		const result = await SignupPage({
			searchParams: Promise.resolve({}),
		});
		render(result as React.ReactElement);
		expect(screen.getByTestId("signup-form")).toBeTruthy();
	});

	it("redirects to login when signup is disabled and no invitationId", async () => {
		vi.resetModules();
		vi.mock("@repo/config", () => ({
			config: { auth: { enableSignup: false } },
		}));
		vi.mock("next/navigation", () => ({ redirect: redirectMock }));
		vi.mock("@saas/auth/lib/server", () => ({
			getInvitation: getInvitationMock,
		}));
		vi.mock("@saas/auth/components/SignupForm", () => ({
			SignupForm: () => <div>SignupForm</div>,
		}));
		vi.mock("ufo", () => ({
			withQuery: (path: string) => path,
		}));

		const { default: SignupPage } = await import("./page");
		try {
			await SignupPage({ searchParams: Promise.resolve({}) });
		} catch (_e) {
			// redirect throws
		}
		expect(redirectMock).toHaveBeenCalledWith(
			expect.stringContaining("/auth/login"),
		);
	});

	it("renders SignupForm with prefillEmail for valid invitation", async () => {
		vi.resetModules();
		const futureDate = new Date(Date.now() + 86400000); // 1 day from now
		getInvitationMock.mockResolvedValue({
			email: "invited@example.com",
			status: "pending",
			expiresAt: futureDate,
		});
		vi.mock("@repo/config", () => ({
			config: { auth: { enableSignup: false } },
		}));
		vi.mock("next/navigation", () => ({ redirect: redirectMock }));
		vi.mock("@saas/auth/lib/server", () => ({
			getInvitation: getInvitationMock,
		}));
		vi.mock("@saas/auth/components/SignupForm", () => ({
			SignupForm: ({ prefillEmail }: { prefillEmail?: string }) => (
				<div
					data-testid="signup-form"
					data-prefill-email={prefillEmail}
				>
					SignupForm
				</div>
			),
		}));
		vi.mock("ufo", () => ({
			withQuery: (path: string) => path,
		}));

		const { default: SignupPage } = await import("./page");
		const result = await SignupPage({
			searchParams: Promise.resolve({ invitationId: "invite-123" }),
		});
		render(result as React.ReactElement);
		const form = screen.getByTestId("signup-form");
		expect(form.getAttribute("data-prefill-email")).toBe(
			"invited@example.com",
		);
	});

	it("generates correct metadata title", async () => {
		const { generateMetadata } = await import("./page");
		const meta = await generateMetadata();
		expect(meta.title).toBe("Create an account");
	});
});
