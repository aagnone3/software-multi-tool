import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
	it("renders as a password field by default", () => {
		render(<PasswordInput value="" onChange={() => {}} />);
		const input = document.querySelector("input");
		expect(input).toHaveAttribute("type", "password");
	});

	it("toggles to text type when eye button is clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<PasswordInput value="" onChange={() => {}} />);
		const toggle = screen.getByRole("button");
		await user.click(toggle);
		const input = document.querySelector("input");
		expect(input).toHaveAttribute("type", "text");
	});

	it("toggles back to password after second click", async () => {
		const user = userEvent.setup({ delay: null });
		render(<PasswordInput value="" onChange={() => {}} />);
		const toggle = screen.getByRole("button");
		await user.click(toggle);
		await user.click(toggle);
		const input = document.querySelector("input");
		expect(input).toHaveAttribute("type", "password");
	});

	it("calls onChange with the new value", async () => {
		const user = userEvent.setup({ delay: null });
		const onChange = vi.fn();
		render(<PasswordInput value="" onChange={onChange} />);
		const input = document.querySelector("input")!;
		await user.type(input, "a");
		expect(onChange).toHaveBeenCalledWith("a");
	});

	it("passes autoComplete prop to input", () => {
		render(
			<PasswordInput
				value=""
				onChange={() => {}}
				autoComplete="current-password"
			/>,
		);
		const input = document.querySelector("input");
		expect(input).toHaveAttribute("autoComplete", "current-password");
	});
});
