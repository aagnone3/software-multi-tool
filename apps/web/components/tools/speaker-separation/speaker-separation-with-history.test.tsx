import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { SpeakerSeparationWithHistory } from "./speaker-separation-with-history";

vi.mock("@tools/components/SpeakerSeparationTool", () => ({
	SpeakerSeparationTool: () => <div>SpeakerSeparationTool</div>,
}));

vi.mock("./speaker-separation-history", () => ({
	SpeakerSeparationHistory: () => <div>SpeakerSeparationHistory</div>,
}));

vi.mock("@saas/payments/components/UpgradeGate", () => ({
	UpgradeGate: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
}));

vi.mock("nuqs", () => ({
	parseAsString: {
		withDefault: (val: string) => ({ defaultValue: val }),
	},
	useQueryState: vi.fn((_key: string, opts: { defaultValue: string }) => [
		opts.defaultValue,
		vi.fn(),
	]),
}));

describe("SpeakerSeparationWithHistory", () => {
	it("renders the tabs with Analyze Audio and History", () => {
		render(<SpeakerSeparationWithHistory />);
		expect(
			screen.getByRole("tab", { name: "Analyze Audio" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("tab", { name: "History" }),
		).toBeInTheDocument();
	});

	it("shows SpeakerSeparationTool by default (analyze tab active)", () => {
		render(<SpeakerSeparationWithHistory />);
		expect(screen.getByText("SpeakerSeparationTool")).toBeInTheDocument();
	});

	it("switches to history tab when clicked", async () => {
		const setActiveTab = vi.fn();
		const { useQueryState } = await import("nuqs");
		vi.mocked(useQueryState).mockReturnValue(["analyze", setActiveTab]);

		const user = userEvent.setup({ delay: null });
		render(<SpeakerSeparationWithHistory />);
		await user.click(screen.getByRole("tab", { name: "History" }));
		expect(setActiveTab).toHaveBeenCalledWith("history");
	});
});
