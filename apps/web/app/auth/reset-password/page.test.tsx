import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ResetPasswordPage from "./page";

vi.mock("@saas/auth/components/ResetPasswordForm", () => ({
	ResetPasswordForm: () => (
		<div data-testid="reset-password-form">ResetPasswordForm</div>
	),
}));

describe("ResetPasswordPage", () => {
	it("renders the ResetPasswordForm", () => {
		render(<ResetPasswordPage />);
		expect(screen.getByTestId("reset-password-form")).toBeInTheDocument();
	});

	it("has correct metadata title", async () => {
		const { generateMetadata } = await import("./page");
		const meta = await generateMetadata();
		expect(meta.title).toBe("Reset your password");
	});
});
