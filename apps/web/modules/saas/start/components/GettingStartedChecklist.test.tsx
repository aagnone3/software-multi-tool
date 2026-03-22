import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks
vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: vi.fn(),
}));
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(),
}));
vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: vi.fn(),
}));
vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: any) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));
vi.mock("@ui/lib", () => ({
	cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useRecentJobs } from "../hooks/use-recent-jobs";
import { GettingStartedChecklist } from "./GettingStartedChecklist";

const mockUseSession = vi.mocked(useSession);
const mockUseActiveOrganization = vi.mocked(useActiveOrganization);
const mockUseRecentJobs = vi.mocked(useRecentJobs);

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("GettingStartedChecklist", () => {
	beforeEach(() => {
		localStorageMock.clear();
		mockUseSession.mockReturnValue({
			user: { name: "" },
			loaded: true,
		} as any);
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: null,
		} as any);
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			isLoading: false,
		} as any);
	});

	it("renders checklist with incomplete items", () => {
		render(<GettingStartedChecklist />);
		expect(screen.getByText("Getting Started")).toBeDefined();
		expect(screen.getByText("Complete your profile")).toBeDefined();
	});

	it("returns null when loading", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: true } as any);
		const { container } = render(<GettingStartedChecklist />);
		expect(container.firstChild).toBeNull();
	});

	it("returns null when dismissed", () => {
		localStorageMock.setItem("getting-started-dismissed", "true");
		const { container } = render(<GettingStartedChecklist />);
		expect(container.firstChild).toBeNull();
	});

	it("returns null when all items are complete", () => {
		mockUseSession.mockReturnValue({
			user: { name: "Alice" },
			loaded: true,
		} as any);
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { name: "Org", slug: "org" },
		} as any);
		mockUseRecentJobs.mockReturnValue({
			jobs: [{}],
			isLoading: false,
		} as any);
		const { container } = render(<GettingStartedChecklist />);
		// all 4 complete (profile, organization, first-tool, billing) → renders null
		expect(container.firstChild).toBeNull();
	});

	it("shows progress bar with percentage", () => {
		mockUseSession.mockReturnValue({
			user: { name: "Alice" },
			loaded: true,
		} as any);
		render(<GettingStartedChecklist />);
		expect(screen.getByText("1 of 4 complete")).toBeDefined();
		expect(screen.getByText("25%")).toBeDefined();
	});

	it("dismisses checklist when X is clicked", () => {
		render(<GettingStartedChecklist />);
		const dismissButton = screen.getByRole("button");
		fireEvent.click(dismissButton);
		expect(localStorageMock.getItem("getting-started-dismissed")).toBe(
			"true",
		);
	});

	it("shows org link when organization exists", () => {
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { name: "Org", slug: "myorg" },
		} as any);
		render(<GettingStartedChecklist />);
		const orgLink = screen
			.getByText("Set up your organization")
			.closest("a");
		expect(orgLink?.getAttribute("href")).toContain("myorg");
	});

	it("shows tools link for first-tool step", () => {
		render(<GettingStartedChecklist />);
		const toolLink = screen.getByText("Try your first tool").closest("a");
		expect(toolLink?.getAttribute("href")).toBe("/app/tools");
	});
});
