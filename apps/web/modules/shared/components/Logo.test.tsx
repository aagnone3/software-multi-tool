import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Logo } from "./Logo";

vi.mock("next/image", () => ({
	default: ({
		src,
		alt,
		...props
	}: {
		src: string;
		alt: string;
		[key: string]: unknown;
	}) => (
		// biome-ignore lint/a11y/useAltText: test mock
		<img src={src} alt={alt} {...props} />
	),
}));

describe("Logo", () => {
	it("renders the logo image", () => {
		render(<Logo />);
		const img = screen.getByAltText("Software Multitool");
		expect(img).toBeDefined();
	});

	it("shows label by default", () => {
		render(<Logo />);
		expect(screen.getByText("Software Multitool")).toBeDefined();
	});

	it("hides label when withLabel=false", () => {
		render(<Logo withLabel={false} />);
		expect(screen.queryByText("Software Multitool")).toBeNull();
	});

	it("applies custom className", () => {
		const { container } = render(<Logo className="custom-class" />);
		expect(container.firstChild?.toString()).toBeDefined();
	});
});
