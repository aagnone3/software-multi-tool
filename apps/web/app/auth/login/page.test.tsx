import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import LoginPage from "./page";

vi.mock("@saas/auth/components/LoginForm", () => ({
	LoginForm: () => <div data-testid="login-form">LoginForm</div>,
}));

describe("LoginPage", () => {
	it("renders the LoginForm", () => {
		render(<LoginPage />);
		expect(screen.getByTestId("login-form")).toBeInTheDocument();
	});

	it("has correct metadata title", async () => {
		const { generateMetadata } = await import("./page");
		const meta = await generateMetadata();
		expect(meta.title).toBe("Welcome back");
	});
});
