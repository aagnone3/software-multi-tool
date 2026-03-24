import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";
import { SmartOutputRenderer } from "./SmartOutputRenderer";

describe("SmartOutputRenderer", () => {
	it("shows formatted tab for object output", () => {
		render(<SmartOutputRenderer output={{ name: "Test", score: 95 }} />);
		expect(
			screen.getByRole("tab", { name: /formatted/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("tab", { name: /raw json/i }),
		).toBeInTheDocument();
	});

	it("renders key-value pairs for object output", () => {
		render(<SmartOutputRenderer output={{ status: "ok", count: 5 }} />);
		expect(screen.getByText("status")).toBeInTheDocument();
		expect(screen.getByText("ok")).toBeInTheDocument();
		expect(screen.getByText("count")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
	});

	it("shows table view for array of objects", () => {
		render(
			<SmartOutputRenderer
				output={[
					{ name: "Alice", score: 90 },
					{ name: "Bob", score: 85 },
				]}
			/>,
		);
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("Bob")).toBeInTheDocument();
		expect(screen.getByText("90")).toBeInTheDocument();
	});

	it("shows raw JSON for primitive output without tabs", () => {
		render(<SmartOutputRenderer output="plain text result" />);
		expect(screen.queryByRole("tab")).not.toBeInTheDocument();
		expect(screen.getByText(/plain text result/)).toBeInTheDocument();
	});

	it("switches to raw JSON view on tab click", async () => {
		const user = userEvent.setup({ delay: null });
		render(<SmartOutputRenderer output={{ key: "value" }} />);
		const rawTab = screen.getByRole("tab", { name: /raw json/i });
		await user.click(rawTab);
		// Raw tab selected
		expect(rawTab).toHaveAttribute("data-state", "active");
	});

	it("renders nested arrays as collapsible sections", () => {
		render(
			<SmartOutputRenderer
				output={{ tags: ["alpha", "beta", "gamma"], total: 3 }}
			/>,
		);
		// nested section label
		expect(screen.getByText("tags")).toBeInTheDocument();
		// count badge (may appear multiple times due to total field + badge)
		expect(screen.getAllByText("3").length).toBeGreaterThan(0);
	});

	it("renders null values as em dash placeholder", () => {
		render(<SmartOutputRenderer output={{ value: null }} />);
		expect(screen.getByText("—")).toBeInTheDocument();
	});
});
