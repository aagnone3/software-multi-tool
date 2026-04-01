import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const useSessionMock = vi.hoisted(() => vi.fn());
const usePurchasesMock = vi.hoisted(() => vi.fn());
const PostHogIdentityProviderMock = vi.hoisted(() => vi.fn());

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: useSessionMock,
}));

vi.mock("@saas/payments/hooks/purchases", () => ({
	usePurchases: usePurchasesMock,
}));

vi.mock("./PostHogIdentityProvider", () => ({
	PostHogIdentityProvider: PostHogIdentityProviderMock,
}));

import { PostHogIdentitySync } from "./PostHogIdentitySync";

describe("PostHogIdentitySync", () => {
	it("renders nothing when no user", () => {
		useSessionMock.mockReturnValue({ user: null, session: null });
		usePurchasesMock.mockReturnValue({ activePlan: null });
		PostHogIdentityProviderMock.mockReturnValue(null);

		const { container } = render(<PostHogIdentitySync />);
		expect(container.firstChild).toBeNull();
	});

	it("renders PostHogIdentityProvider with user data", () => {
		useSessionMock.mockReturnValue({
			user: { id: "u1", email: "a@b.com", name: "Alice" },
			session: { activeOrganizationId: "org1" },
		});
		usePurchasesMock.mockReturnValue({ activePlan: { id: "pro" } });
		PostHogIdentityProviderMock.mockReturnValue(<div data-testid="phip" />);

		const { getByTestId } = render(<PostHogIdentitySync />);
		expect(getByTestId("phip")).toBeTruthy();
		expect(PostHogIdentityProviderMock).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "u1",
				email: "a@b.com",
				name: "Alice",
				organizationId: "org1",
				planId: "pro",
			}),
			undefined,
		);
	});

	it("defaults planId to 'free' when no active plan", () => {
		useSessionMock.mockReturnValue({
			user: { id: "u2", email: "b@c.com", name: "Bob" },
			session: null,
		});
		usePurchasesMock.mockReturnValue({ activePlan: null });
		PostHogIdentityProviderMock.mockReturnValue(<div />);

		render(<PostHogIdentitySync />);
		expect(PostHogIdentityProviderMock).toHaveBeenCalledWith(
			expect.objectContaining({ planId: "free", organizationId: null }),
			undefined,
		);
	});
});
