import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import ToolHistoryLoading from "./loading";

describe("ToolHistoryLoading", () => {
	it("renders without crashing", () => {
		const { container } = render(<ToolHistoryLoading />);
		expect(container.firstChild).toBeTruthy();
	});

	it("renders multiple animated skeleton divs", () => {
		const { container } = render(<ToolHistoryLoading />);
		// Skeleton renders as animate-pulse divs
		const skeletons = container.querySelectorAll(".animate-pulse");
		expect(skeletons.length).toBeGreaterThan(5);
	});
});
