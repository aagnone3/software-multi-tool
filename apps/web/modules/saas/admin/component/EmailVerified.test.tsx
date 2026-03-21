import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { EmailVerified } from "./EmailVerified";

describe("EmailVerified", () => {
	it("renders CheckIcon when verified", () => {
		const { container } = render(<EmailVerified verified={true} />);
		expect(container.querySelector("svg")).toBeTruthy();
	});

	it("renders ClockIcon when not verified", () => {
		const { container } = render(<EmailVerified verified={false} />);
		expect(container.querySelector("svg")).toBeTruthy();
	});

	it("applies className to trigger", () => {
		const { container } = render(
			<EmailVerified verified={true} className="test-class" />,
		);
		expect(container.querySelector(".test-class")).toBeTruthy();
	});
});
