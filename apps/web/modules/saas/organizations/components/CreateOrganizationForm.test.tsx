import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateOrganizationForm } from "./CreateOrganizationForm";

const {
	mockMutateAsync,
	mockInvalidateQueries,
	mockReplace,
	mockSetActiveOrganization,
	mockToastError,
	mockTrack,
} = vi.hoisted(() => ({
	mockMutateAsync: vi.fn(),
	mockInvalidateQueries: vi.fn(),
	mockReplace: vi.fn(),
	mockSetActiveOrganization: vi.fn(),
	mockToastError: vi.fn(),
	mockTrack: vi.fn(),
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@saas/organizations/lib/api", () => ({
	organizationListQueryKey: ["orgs"],
	useCreateOrganizationMutation: () => ({ mutateAsync: mockMutateAsync }),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({
		setActiveOrganization: mockSetActiveOrganization,
	}),
}));

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("sonner", () => ({
	toast: { error: mockToastError },
}));

describe("CreateOrganizationForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders with default name", () => {
		render(<CreateOrganizationForm defaultName="My Org" />);
		expect(screen.getByRole("textbox")).toHaveValue("My Org");
		expect(
			screen.getByRole("button", { name: /create organization/i }),
		).toBeInTheDocument();
	});

	it("creates org and redirects on success", async () => {
		mockMutateAsync.mockResolvedValue({
			slug: "my-org",
			name: "My New Org",
		});
		mockSetActiveOrganization.mockResolvedValue(undefined);
		const user = userEvent.setup({ delay: null });
		render(<CreateOrganizationForm />);

		const input = screen.getByRole("textbox");
		await user.clear(input);
		await user.type(input, "My New Org");
		await user.click(
			screen.getByRole("button", { name: /create organization/i }),
		);

		await waitFor(() => {
			expect(mockMutateAsync).toHaveBeenCalledWith({
				name: "My New Org",
			});
			expect(mockSetActiveOrganization).toHaveBeenCalledWith("my-org");
			expect(mockTrack).toHaveBeenCalledWith({
				name: "org_created",
				props: {},
			});
			expect(mockReplace).toHaveBeenCalledWith("/app/my-org");
		});
	});

	it("shows error toast when creation fails", async () => {
		mockMutateAsync.mockRejectedValue(new Error("fail"));
		const user = userEvent.setup({ delay: null });
		render(<CreateOrganizationForm />);

		await user.type(screen.getByRole("textbox"), "My New Org");
		await user.click(
			screen.getByRole("button", { name: /create organization/i }),
		);

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalled();
		});
	});
});
