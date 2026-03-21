import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockMutateAsync = vi.fn();
vi.mock("@tanstack/react-query", () => ({
	useMutation: vi.fn(() => ({
		mutateAsync: mockMutateAsync,
		isPending: false,
	})),
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		payments: {
			createCustomerPortalLink: {
				mutationOptions: vi.fn(() => ({})),
			},
		},
	},
}));

const mockToastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: mockToastError } }));

vi.mock("@ui/components/button", () => ({
	Button: ({ children, onClick, loading, ...props }: any) => (
		<button onClick={onClick} data-loading={loading} {...props}>
			{children}
		</button>
	),
}));

vi.mock("lucide-react", () => ({
	CreditCardIcon: () => <span>icon</span>,
}));

import { CustomerPortalButton } from "./CustomerPortalButton";

describe("CustomerPortalButton", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.defineProperty(window, "location", {
			value: { href: "http://localhost/settings" },
			writable: true,
		});
	});

	it("renders the manage billing button", () => {
		render(<CustomerPortalButton purchaseId="p1" />);
		expect(screen.getByText("Manage billing")).toBeTruthy();
	});

	it("calls mutateAsync with purchaseId and redirectUrl on click", async () => {
		mockMutateAsync.mockResolvedValue({
			customerPortalLink: "https://portal.example.com",
		});
		render(<CustomerPortalButton purchaseId="p1" />);
		fireEvent.click(screen.getByText("Manage billing"));
		expect(mockMutateAsync).toHaveBeenCalledWith({
			purchaseId: "p1",
			redirectUrl: "http://localhost/settings",
		});
	});

	it("shows error toast when mutation fails", async () => {
		mockMutateAsync.mockRejectedValue(new Error("fail"));
		render(<CustomerPortalButton purchaseId="p1" />);
		fireEvent.click(screen.getByText("Manage billing"));
		await new Promise((r) => setTimeout(r, 50));
		expect(mockToastError).toHaveBeenCalledWith(
			"Could not create a customer portal session. Please try again.",
		);
	});
});
