import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ActiveOrganizationContext } from "../lib/active-organization-context";
import { useActiveOrganization } from "./use-active-organization";

describe("useActiveOrganization", () => {
	it("returns null defaults when used outside provider", () => {
		const { result } = renderHook(() => useActiveOrganization());

		expect(result.current.activeOrganization).toBeNull();
		expect(result.current.activeOrganizationUserRole).toBeNull();
		expect(result.current.isOrganizationAdmin).toBe(false);
		expect(result.current.loaded).toBe(true);
		expect(result.current.isOrgRoute).toBe(false);
	});

	it("setActiveOrganization resolves when no provider", async () => {
		const { result } = renderHook(() => useActiveOrganization());
		await expect(
			result.current.setActiveOrganization("org-1"),
		).resolves.toBeUndefined();
	});

	it("refetchActiveOrganization resolves when no provider", async () => {
		const { result } = renderHook(() => useActiveOrganization());
		await expect(
			result.current.refetchActiveOrganization(),
		).resolves.toBeUndefined();
	});

	it("returns context value when inside provider", () => {
		const mockContext = {
			activeOrganization: {
				id: "org-1",
				name: "Test Org",
				members: [],
			} as never,
			activeOrganizationUserRole: "owner" as const,
			isOrganizationAdmin: true,
			loaded: true,
			isOrgRoute: true,
			setActiveOrganization: vi.fn(),
			refetchActiveOrganization: vi.fn(),
		};

		const wrapper = ({ children }: { children: React.ReactNode }) =>
			React.createElement(
				ActiveOrganizationContext.Provider,
				{ value: mockContext },
				children,
			);

		const { result } = renderHook(() => useActiveOrganization(), {
			wrapper,
		});

		expect(result.current.activeOrganization).toEqual(
			mockContext.activeOrganization,
		);
		expect(result.current.isOrganizationAdmin).toBe(true);
		expect(result.current.activeOrganizationUserRole).toBe("owner");
	});
});
