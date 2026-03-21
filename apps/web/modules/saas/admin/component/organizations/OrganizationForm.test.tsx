import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationForm } from "./OrganizationForm";

const mockRouterReplace = vi.hoisted(() => vi.fn());
const useFullOrganizationQueryMock = vi.hoisted(() => vi.fn());
const useUpdateOrganizationMutationMock = vi.hoisted(() => vi.fn());
const useCreateOrganizationMutationMock = vi.hoisted(() => vi.fn());
const useQueryClientMock = vi.hoisted(() => vi.fn());
const invalidateQueriesMock = vi.hoisted(() => vi.fn());
const setQueryDataMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ replace: mockRouterReplace }),
}));

vi.mock("@saas/organizations/lib/api", () => ({
	useFullOrganizationQuery: useFullOrganizationQueryMock,
	useUpdateOrganizationMutation: useUpdateOrganizationMutationMock,
	useCreateOrganizationMutation: useCreateOrganizationMutationMock,
	fullOrganizationQueryKey: (id: string) => ["org", id],
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		admin: {
			organizations: {
				list: {
					key: () => ["admin", "organizations"],
				},
			},
		},
	},
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: useQueryClientMock,
}));

vi.mock("@saas/organizations/components/OrganizationMembersBlock", () => ({
	OrganizationMembersBlock: () => <div data-testid="members-block" />,
}));

vi.mock("@saas/organizations/components/InviteMemberForm", () => ({
	InviteMemberForm: () => <div data-testid="invite-form" />,
}));

vi.mock("@saas/admin/lib/links", () => ({
	getAdminPath: (path: string) => `/admin${path}`,
}));

vi.mock("sonner", () => ({
	toast: { success: toastSuccessMock, error: toastErrorMock },
}));

const makeUpdateMutation = (mutateAsync = vi.fn()) => ({
	mutateAsync,
	isPending: false,
});
const makeCreateMutation = (mutateAsync = vi.fn()) => ({
	mutateAsync,
	isPending: false,
});

describe("OrganizationForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useQueryClientMock.mockReturnValue({
			invalidateQueries: invalidateQueriesMock,
			setQueryData: setQueryDataMock,
		});
		useUpdateOrganizationMutationMock.mockReturnValue(makeUpdateMutation());
		useCreateOrganizationMutationMock.mockReturnValue(makeCreateMutation());
	});

	it("renders 'Create organization' when no org loaded", () => {
		useFullOrganizationQueryMock.mockReturnValue({ data: undefined });
		render(<OrganizationForm organizationId="new" />);
		expect(screen.getByText("Create organization")).toBeInTheDocument();
	});

	it("renders 'Update organization' when org is loaded", () => {
		useFullOrganizationQueryMock.mockReturnValue({
			data: { id: "org-1", name: "Acme", members: [] },
		});
		render(<OrganizationForm organizationId="org-1" />);
		expect(screen.getByText("Update organization")).toBeInTheDocument();
	});

	it("pre-fills input with current org name", () => {
		useFullOrganizationQueryMock.mockReturnValue({
			data: { id: "org-1", name: "My Corp", members: [] },
		});
		render(<OrganizationForm organizationId="org-1" />);
		expect(screen.getByDisplayValue("My Corp")).toBeInTheDocument();
	});

	it("calls updateOrganizationMutation on submit when org exists", async () => {
		const mutateAsync = vi
			.fn()
			.mockResolvedValue({ id: "org-1", name: "New Name" });
		useFullOrganizationQueryMock.mockReturnValue({
			data: { id: "org-1", name: "Old Name", members: [] },
		});
		useUpdateOrganizationMutationMock.mockReturnValue(
			makeUpdateMutation(mutateAsync),
		);

		const user = userEvent.setup({ delay: null });
		render(<OrganizationForm organizationId="org-1" />);

		const input = screen.getByDisplayValue("Old Name");
		await user.clear(input);
		await user.type(input, "New Name");
		await user.click(screen.getByRole("button", { name: /save/i }));

		await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
		expect(toastSuccessMock).toHaveBeenCalled();
	});

	it("shows error toast on failed save", async () => {
		const mutateAsync = vi.fn().mockRejectedValue(new Error("fail"));
		useFullOrganizationQueryMock.mockReturnValue({
			data: { id: "org-1", name: "Acme", members: [] },
		});
		useUpdateOrganizationMutationMock.mockReturnValue(
			makeUpdateMutation(mutateAsync),
		);

		const user = userEvent.setup({ delay: null });
		render(<OrganizationForm organizationId="org-1" />);

		await user.click(screen.getByRole("button", { name: /save/i }));

		await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
	});

	it("renders members block and invite form when org exists", () => {
		useFullOrganizationQueryMock.mockReturnValue({
			data: { id: "org-1", name: "Acme", members: [] },
		});
		render(<OrganizationForm organizationId="org-1" />);
		expect(screen.getByTestId("members-block")).toBeInTheDocument();
		expect(screen.getByTestId("invite-form")).toBeInTheDocument();
	});
});
