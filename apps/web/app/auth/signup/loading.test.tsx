import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import SignupLoading from "./loading";

describe("SignupLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<SignupLoading />);
		expect(container.firstChild).toBeTruthy();
	});

	it("renders skeleton elements for the signup form", () => {
		const { container } = render(<SignupLoading />);
		const skeletons = container.querySelectorAll(
			".animate-pulse, [class*='skeleton']",
		);
		expect(skeletons.length).toBeGreaterThan(0);
	});

	it("renders centered layout container", () => {
		const { container } = render(<SignupLoading />);
		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper.className).toContain("flex");
		expect(wrapper.className).toContain("items-center");
		expect(wrapper.className).toContain("justify-center");
	});
});
