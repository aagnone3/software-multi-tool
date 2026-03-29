import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReferralWidget } from "./ReferralWidget";

// Mocks
vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => ({ user: { id: "user-123", name: "Alice" } }),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

const mockWriteText = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
	Object.defineProperty(navigator, "clipboard", {
		value: { writeText: mockWriteText },
		configurable: true,
		writable: true,
	});
	vi.clearAllMocks();
});

describe("ReferralWidget", () => {
	it("renders the widget title and description", () => {
		render(<ReferralWidget />);
		expect(
			screen.getByText("Refer friends, earn free credits"),
		).toBeInTheDocument();
		expect(screen.getByText(/10 free credits/i)).toBeInTheDocument();
	});

	it("shows the three how-it-works steps", () => {
		render(<ReferralWidget />);
		expect(screen.getByText("Share your link")).toBeInTheDocument();
		expect(screen.getByText("They sign up")).toBeInTheDocument();
		expect(screen.getByText(/You earn 10 credits/i)).toBeInTheDocument();
	});

	it("renders a referral link input", () => {
		render(<ReferralWidget />);
		const input = screen.getByRole("textbox", { name: /referral link/i });
		expect(input).toBeInTheDocument();
	});

	it("renders a copy button", () => {
		render(<ReferralWidget />);
		const copyBtn = screen.getByRole("button", {
			name: /copy referral link/i,
		});
		expect(copyBtn).toBeInTheDocument();
	});

	it("copies the link and shows success toast on copy click", async () => {
		const { toast } = await import("sonner");
		render(<ReferralWidget />);
		const copyBtn = screen.getByRole("button", {
			name: /copy referral link/i,
		});
		fireEvent.click(copyBtn);
		await waitFor(() => {
			expect(mockWriteText).toHaveBeenCalled();
			expect(toast.success).toHaveBeenCalledWith(
				"Referral link copied!",
				expect.anything(),
			);
		});
	});

	it("accepts a className prop", () => {
		const { container } = render(<ReferralWidget className="test-class" />);
		expect(container.querySelector(".test-class")).toBeInTheDocument();
	});
});
