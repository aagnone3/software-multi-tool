import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StickyCta } from "./StickyCta";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

describe("StickyCta", () => {
	beforeEach(() => {
		Object.defineProperty(window, "scrollY", { value: 0, writable: true });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("is not visible initially (scrollY = 0)", () => {
		render(<StickyCta />);
		expect(screen.queryByText(/start free/i)).toBeNull();
	});

	it("becomes visible when scrollY > 400", () => {
		render(<StickyCta />);
		act(() => {
			Object.defineProperty(window, "scrollY", {
				value: 500,
				writable: true,
			});
			window.dispatchEvent(new Event("scroll"));
		});
		expect(screen.getByText(/start free/i)).toBeTruthy();
	});

	it("contains a signup link", () => {
		render(<StickyCta />);
		act(() => {
			Object.defineProperty(window, "scrollY", {
				value: 500,
				writable: true,
			});
			window.dispatchEvent(new Event("scroll"));
		});
		const link = screen.getByRole("link", { name: /get started/i });
		expect(link).toBeTruthy();
		expect((link as HTMLAnchorElement).href).toContain("/auth/signup");
	});

	it("hides when dismissed", () => {
		render(<StickyCta />);
		act(() => {
			Object.defineProperty(window, "scrollY", {
				value: 500,
				writable: true,
			});
			window.dispatchEvent(new Event("scroll"));
		});
		const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
		fireEvent.click(dismissBtn);
		expect(screen.queryByText(/start free/i)).toBeNull();
	});
});
