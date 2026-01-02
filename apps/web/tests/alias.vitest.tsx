import { render, screen } from "@testing-library/react";
import { cn } from "@ui/lib";
import React, { type ReactNode } from "react";
import { describe, expect, it } from "vitest";

function SampleBadge({ children }: { children: ReactNode }) {
	return (
		<span data-testid="sample-badge" className={cn("px-2", "py-1")}>
			{children}
		</span>
	);
}

describe("path alias wiring", () => {
	it("resolves @ui alias and applies jest-dom matchers", () => {
		render(<SampleBadge>Alias Ready</SampleBadge>);
		const badge = screen.getByTestId("sample-badge");
		expect(badge).toBeInTheDocument();
		expect(badge).toHaveClass("px-2 py-1");
	});
});
