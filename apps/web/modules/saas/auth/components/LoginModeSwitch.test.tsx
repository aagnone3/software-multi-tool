import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { LoginModeSwitch } from "./LoginModeSwitch";

describe("LoginModeSwitch", () => {
	it("renders password and magic-link tabs", () => {
		render(<LoginModeSwitch activeMode="password" onChange={() => {}} />);
		expect(screen.getByRole("tab", { name: "Password" })).toBeDefined();
		expect(screen.getByRole("tab", { name: "Magic link" })).toBeDefined();
	});

	it("marks the active mode tab as selected", () => {
		render(<LoginModeSwitch activeMode="magic-link" onChange={() => {}} />);
		const magicTab = screen.getByRole("tab", { name: "Magic link" });
		expect(magicTab.getAttribute("data-state")).toBe("active");
	});

	it("calls onChange when a tab is clicked", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<LoginModeSwitch activeMode="password" onChange={onChange} />);
		await user.click(screen.getByRole("tab", { name: "Magic link" }));
		expect(onChange).toHaveBeenCalledWith("magic-link");
	});

	it("applies className prop", () => {
		const { container } = render(
			<LoginModeSwitch
				activeMode="password"
				onChange={() => {}}
				className="my-class"
			/>,
		);
		expect(container.firstChild?.toString()).toContain("my-class");
	});
});
