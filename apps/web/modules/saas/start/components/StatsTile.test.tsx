import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { StatsTile } from "./StatsTile";

vi.mock("@shared/hooks/locale-currency", () => ({
	useLocaleCurrency: () => "USD",
}));

describe("StatsTile", () => {
	it("renders title", () => {
		render(
			<StatsTile
				title="Total Revenue"
				value={1000}
				valueFormat="currency"
			/>,
		);
		expect(screen.getByText("Total Revenue")).toBeDefined();
	});

	it("formats currency values", () => {
		render(
			<StatsTile
				title="Revenue"
				value={1234.56}
				valueFormat="currency"
			/>,
		);
		expect(screen.getByText(/1,234/)).toBeDefined();
	});

	it("formats number values", () => {
		render(<StatsTile title="Count" value={9876} valueFormat="number" />);
		expect(screen.getByText("9,876")).toBeDefined();
	});

	it("formats percentage values", () => {
		render(
			<StatsTile title="Rate" value={0.75} valueFormat="percentage" />,
		);
		expect(screen.getByText(/75%/)).toBeDefined();
	});

	it("renders context when provided", () => {
		render(
			<StatsTile
				title="Speed"
				value={100}
				valueFormat="number"
				context=" mph"
			/>,
		);
		expect(screen.getByText("mph")).toBeDefined();
	});

	it("renders positive trend badge", () => {
		render(
			<StatsTile
				title="Revenue"
				value={100}
				valueFormat="number"
				trend={0.1}
			/>,
		);
		expect(screen.getByText(/\+10%/)).toBeDefined();
	});

	it("renders negative trend badge", () => {
		render(
			<StatsTile
				title="Revenue"
				value={100}
				valueFormat="number"
				trend={-0.05}
			/>,
		);
		expect(screen.getByText(/-5%/)).toBeDefined();
	});

	it("does not render trend when not provided", () => {
		render(<StatsTile title="Revenue" value={100} valueFormat="number" />);
		expect(screen.queryByText(/%/)).toBeNull();
	});
});
