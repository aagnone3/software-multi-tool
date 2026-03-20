import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authClientMock = vi.hoisted(() => ({
	organization: {
		list: vi.fn(),
		getFullOrganization: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
	},
}));

const orpcClientMock = vi.hoisted(() => ({
	organizations: {
		generateSlug: vi.fn(),
	},
}));

vi.mock("@repo/auth/client", () => ({
	authClient: authClientMock,
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: orpcClientMock,
}));

import {
	activeOrganizationQueryKey,
	createOrganizationMutationKey,
	fullOrganizationQueryKey,
	organizationListQueryKey,
	updateOrganizationMutationKey,
	useActiveOrganizationQuery,
	useCreateOrganizationMutation,
	useFullOrganizationQuery,
	useOrganizationListQuery,
	useUpdateOrganizationMutation,
} from "./api";

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return ({ children }: { children: React.ReactNode }) =>
		React.createElement(
			QueryClientProvider,
			{ client: queryClient },
			children,
		);
}

describe("query keys", () => {
	it("organizationListQueryKey is stable", () => {
		expect(organizationListQueryKey).toEqual(["user", "organizations"]);
	});

	it("activeOrganizationQueryKey includes slug", () => {
		expect(activeOrganizationQueryKey("my-org")).toEqual([
			"user",
			"activeOrganization",
			"my-org",
		]);
	});

	it("fullOrganizationQueryKey includes id", () => {
		expect(fullOrganizationQueryKey("org-123")).toEqual([
			"fullOrganization",
			"org-123",
		]);
	});

	it("createOrganizationMutationKey is stable", () => {
		expect(createOrganizationMutationKey).toEqual(["create-organization"]);
	});

	it("updateOrganizationMutationKey is stable", () => {
		expect(updateOrganizationMutationKey).toEqual(["update-organization"]);
	});
});

describe("useOrganizationListQuery", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns organizations on success", async () => {
		const orgs = [{ id: "org-1", name: "Acme" }];
		authClientMock.organization.list.mockResolvedValue({
			data: orgs,
			error: null,
		});

		const { result } = renderHook(() => useOrganizationListQuery(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(orgs);
	});

	it("throws on error", async () => {
		authClientMock.organization.list.mockResolvedValue({
			data: null,
			error: { message: "Unauthorized" },
		});

		const { result } = renderHook(() => useOrganizationListQuery(), {
			wrapper: createWrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect((result.current.error as Error).message).toBe("Unauthorized");
	});
});

describe("useActiveOrganizationQuery", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns org on success", async () => {
		const org = { id: "org-1", slug: "acme" };
		authClientMock.organization.getFullOrganization.mockResolvedValue({
			data: org,
			error: null,
		});

		const { result } = renderHook(
			() => useActiveOrganizationQuery("acme"),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(org);
	});

	it("throws on error", async () => {
		authClientMock.organization.getFullOrganization.mockResolvedValue({
			data: null,
			error: { message: "Not found" },
		});

		const { result } = renderHook(
			() => useActiveOrganizationQuery("missing"),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect((result.current.error as Error).message).toBe("Not found");
	});

	it("respects enabled option", async () => {
		const { result } = renderHook(
			() => useActiveOrganizationQuery("acme", { enabled: false }),
			{ wrapper: createWrapper() },
		);

		expect(result.current.fetchStatus).toBe("idle");
		expect(
			authClientMock.organization.getFullOrganization,
		).not.toHaveBeenCalled();
	});
});

describe("useFullOrganizationQuery", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns org by id", async () => {
		const org = { id: "org-123", name: "Big Corp" };
		authClientMock.organization.getFullOrganization.mockResolvedValue({
			data: org,
			error: null,
		});

		const { result } = renderHook(
			() => useFullOrganizationQuery("org-123"),
			{
				wrapper: createWrapper(),
			},
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(org);
		expect(
			authClientMock.organization.getFullOrganization,
		).toHaveBeenCalledWith({
			query: { organizationId: "org-123" },
		});
	});
});

describe("useCreateOrganizationMutation", () => {
	beforeEach(() => vi.clearAllMocks());

	it("creates organization with generated slug", async () => {
		orpcClientMock.organizations.generateSlug.mockResolvedValue({
			slug: "acme-corp",
		});
		authClientMock.organization.create.mockResolvedValue({
			data: { id: "org-new", name: "Acme Corp", slug: "acme-corp" },
			error: null,
		});

		const { result } = renderHook(() => useCreateOrganizationMutation(), {
			wrapper: createWrapper(),
		});

		await result.current.mutateAsync({ name: "Acme Corp" });

		expect(orpcClientMock.organizations.generateSlug).toHaveBeenCalledWith({
			name: "Acme Corp",
		});
		expect(authClientMock.organization.create).toHaveBeenCalledWith({
			name: "Acme Corp",
			slug: "acme-corp",
			metadata: undefined,
		});
	});

	it("throws on create error", async () => {
		orpcClientMock.organizations.generateSlug.mockResolvedValue({
			slug: "bad-org",
		});
		const err = new Error("Already exists");
		authClientMock.organization.create.mockResolvedValue({
			data: null,
			error: err,
		});

		const { result } = renderHook(() => useCreateOrganizationMutation(), {
			wrapper: createWrapper(),
		});

		await expect(
			result.current.mutateAsync({ name: "bad-org" }),
		).rejects.toThrow("Already exists");
	});
});

describe("useUpdateOrganizationMutation", () => {
	beforeEach(() => vi.clearAllMocks());

	it("updates organization without regenerating slug by default", async () => {
		authClientMock.organization.update.mockResolvedValue({
			data: { id: "org-1", name: "New Name" },
			error: null,
		});

		const { result } = renderHook(() => useUpdateOrganizationMutation(), {
			wrapper: createWrapper(),
		});

		await result.current.mutateAsync({ id: "org-1", name: "New Name" });

		expect(
			orpcClientMock.organizations.generateSlug,
		).not.toHaveBeenCalled();
		expect(authClientMock.organization.update).toHaveBeenCalledWith({
			organizationId: "org-1",
			data: { name: "New Name", slug: undefined, metadata: undefined },
		});
	});

	it("regenerates slug when updateSlug=true", async () => {
		orpcClientMock.organizations.generateSlug.mockResolvedValue({
			slug: "new-name",
		});
		authClientMock.organization.update.mockResolvedValue({
			data: { id: "org-1", name: "New Name", slug: "new-name" },
			error: null,
		});

		const { result } = renderHook(() => useUpdateOrganizationMutation(), {
			wrapper: createWrapper(),
		});

		await result.current.mutateAsync({
			id: "org-1",
			name: "New Name",
			updateSlug: true,
		});

		expect(orpcClientMock.organizations.generateSlug).toHaveBeenCalledWith({
			name: "New Name",
		});
		expect(authClientMock.organization.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({ slug: "new-name" }),
			}),
		);
	});
});
