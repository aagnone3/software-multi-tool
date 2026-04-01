import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import VerifyPage from "./page";

vi.mock("@saas/auth/components/OtpForm", () => ({
	OtpForm: () => <div data-testid="otp-form">OtpForm</div>,
}));

describe("VerifyPage", () => {
	it("renders the OtpForm", () => {
		render(<VerifyPage />);
		expect(screen.getByTestId("otp-form")).toBeInTheDocument();
	});

	it("has correct metadata title", async () => {
		const { generateMetadata } = await import("./page");
		const meta = await generateMetadata();
		expect(meta.title).toBe("Verify your account");
	});
});
