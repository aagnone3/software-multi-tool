import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ForgotPasswordPage from "./page";

vi.mock("@saas/auth/components/ForgotPasswordForm", () => ({
	ForgotPasswordForm: () => (
		<div data-testid="forgot-password-form">ForgotPasswordForm</div>
	),
}));

describe("ForgotPasswordPage", () => {
	it("renders the ForgotPasswordForm", () => {
		render(<ForgotPasswordPage />);
		expect(screen.getByTestId("forgot-password-form")).toBeInTheDocument();
	});

	it("has correct metadata title", async () => {
		const { generateMetadata } = await import("./page");
		const meta = await generateMetadata();
		expect(meta.title).toBe("Forgot your password?");
	});
});
