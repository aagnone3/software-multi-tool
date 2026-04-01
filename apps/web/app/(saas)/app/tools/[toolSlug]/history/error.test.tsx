import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ToolHistoryErrorBoundary from "./error";

describe("ToolHistoryErrorBoundary", () => {
	it("renders error heading", () => {
		render(
			<ToolHistoryErrorBoundary
				error={new Error("test")}
				reset={() => {}}
			/>,
		);
		expect(
			screen.getByRole("heading", {
				name: /could not load run history/i,
			}),
		).toBeInTheDocument();
	});

	it("calls reset when Try again is clicked", () => {
		const reset = vi.fn();
		render(
			<ToolHistoryErrorBoundary
				error={new Error("test")}
				reset={reset}
			/>,
		);
		fireEvent.click(screen.getByRole("button", { name: /try again/i }));
		expect(reset).toHaveBeenCalledTimes(1);
	});

	it("renders Back to tools link", () => {
		render(
			<ToolHistoryErrorBoundary
				error={new Error("test")}
				reset={() => {}}
			/>,
		);
		const link = screen.getByRole("link", { name: /back to tools/i });
		expect(link).toHaveAttribute("href", "/app/tools");
	});

	it("logs error to console", () => {
		const consoleSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const err = new Error("history error");
		render(<ToolHistoryErrorBoundary error={err} reset={() => {}} />);
		expect(consoleSpy).toHaveBeenCalledWith(
			"Tool history page error:",
			err,
		);
		consoleSpy.mockRestore();
	});
});
