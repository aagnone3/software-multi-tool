import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useSessionMock = vi.hoisted(() => vi.fn());
const usePathnameMock = vi.hoisted(() => vi.fn(() => "/"));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: useSessionMock,
}));

vi.mock("next/navigation", () => ({
	usePathname: usePathnameMock,
	useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("@shared/components/ColorModeToggle", () => ({
	ColorModeToggle: () => <button type="button">Toggle</button>,
}));

vi.mock("@shared/components/Logo", () => ({
	Logo: () => <span>Logo</span>,
}));

vi.mock("usehooks-ts", () => ({
	useDebounceCallback: (fn: () => void) => fn,
}));

import { NavBar } from "./NavBar";

describe("NavBar", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useSessionMock.mockReturnValue({ user: null });
		usePathnameMock.mockReturnValue("/");
	});

	it("renders the navigation element", () => {
		render(<NavBar />);
		expect(document.querySelector('[data-test="navigation"]')).toBeTruthy();
	});

	it("shows Login link when no user", () => {
		render(<NavBar />);
		const loginLinks = screen.getAllByRole("link", { name: /login/i });
		expect(loginLinks.length).toBeGreaterThan(0);
	});

	it("shows explicit free-credit CTA when no user", () => {
		render(<NavBar />);
		const signupLinks = screen.getAllByRole("link", {
			name: /get 10 free credits/i,
		});
		expect(signupLinks.length).toBeGreaterThan(0);
		expect(signupLinks[0]).toHaveAttribute("href", "/auth/signup");
	});

	it("does not show free-credit CTA when user is logged in", () => {
		useSessionMock.mockReturnValue({
			user: { id: "u1", name: "Alice" },
		});
		render(<NavBar />);
		const signupLinks = screen.queryAllByRole("link", {
			name: /get 10 free credits/i,
		});
		expect(signupLinks.length).toBe(0);
	});

	it("shows Dashboard link when user is logged in", () => {
		useSessionMock.mockReturnValue({
			user: { id: "u1", name: "Alice" },
		});
		render(<NavBar />);
		const dashLinks = screen.getAllByRole("link", { name: /dashboard/i });
		expect(dashLinks.length).toBeGreaterThan(0);
	});

	it("renders Pricing and Blog menu items", () => {
		render(<NavBar />);
		expect(
			screen.getAllByRole("link", { name: "Pricing" }).length,
		).toBeGreaterThan(0);
		expect(
			screen.getAllByRole("link", { name: "Blog" }).length,
		).toBeGreaterThan(0);
	});

	it("renders Docs menu item", () => {
		render(<NavBar />);
		expect(
			screen.getAllByRole("link", { name: "Docs" }).length,
		).toBeGreaterThan(0);
	});
});
