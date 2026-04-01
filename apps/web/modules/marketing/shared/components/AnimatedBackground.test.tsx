import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { AnimatedBackground } from "./AnimatedBackground";

describe("AnimatedBackground", () => {
	it("renders without crashing", () => {
		const { container } = render(<AnimatedBackground />);
		expect(container.firstChild).not.toBeNull();
	});

	it("renders a fixed-position overlay container", () => {
		const { container } = render(<AnimatedBackground />);
		const root = container.firstChild as HTMLElement;
		expect(root.classList.contains("fixed")).toBe(true);
	});

	it("contains style element for keyframe animations", () => {
		const { container } = render(<AnimatedBackground />);
		const styles = container.querySelectorAll("style");
		expect(styles.length).toBeGreaterThan(0);
	});
});
