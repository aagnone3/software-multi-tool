import { describe, expect, it, vi } from "vitest";

import { invitationOnlyPlugin } from "./index";

const { getPendingInvitationByEmail, configMock, createAuthMiddlewareSpy } =
	vi.hoisted(() => ({
		getPendingInvitationByEmail: vi.fn(),
		configMock: {
			auth: {
				enableSignup: false,
			},
		},
		createAuthMiddlewareSpy: vi.fn((handler) => handler),
	}));

vi.mock("@repo/config", () => ({
	config: configMock,
}));

vi.mock("@repo/database", () => ({
	getPendingInvitationByEmail,
}));

vi.mock("better-auth/plugins", async () => {
	const actual = await vi.importActual<typeof import("better-auth/plugins")>(
		"better-auth/plugins",
	);
	return {
		...actual,
		createAuthMiddleware: (handler: any) =>
			createAuthMiddlewareSpy(handler),
	};
});

describe("invitationOnlyPlugin", () => {
	beforeEach(() => {
		getPendingInvitationByEmail.mockReset();
		configMock.auth.enableSignup = false;
		createAuthMiddlewareSpy.mockClear();
	});

	const getHandler = () => {
		const plugin = invitationOnlyPlugin();
		const hook = plugin.hooks.before?.[0];
		if (!hook) {
			throw new Error("Invitation hook not registered");
		}

		return hook.handler;
	};

	it("does nothing when signup is enabled", async () => {
		configMock.auth.enableSignup = true;
		const handler = getHandler();

		await handler({
			path: "/sign-up/email",
			body: { email: "user@example.com" },
		});

		expect(getPendingInvitationByEmail).not.toHaveBeenCalled();
	});

	it("allows requests with a pending invitation", async () => {
		getPendingInvitationByEmail.mockResolvedValueOnce({ id: "invite-1" });
		const handler = getHandler();

		await handler({
			path: "/sign-up/email",
			body: { email: "member@example.com" },
		});

		expect(getPendingInvitationByEmail).toHaveBeenCalledWith(
			"member@example.com",
		);
	});

	it("rejects signups without an invitation", async () => {
		getPendingInvitationByEmail.mockResolvedValueOnce(null);
		const handler = getHandler();
		const context = {
			path: "/sign-up/email",
			body: { email: "blocked@example.com" },
		};

		await expect.assertions(2);

		try {
			await handler(context);
		} catch (error) {
			const thrown = error as {
				status?: string;
				body?: { code?: string };
			};
			expect(thrown.status).toBe("BAD_REQUEST");
			expect(thrown.body?.code).toBe("INVALID_INVITATION");
		}
	});
});
