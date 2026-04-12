"use client";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

// ---- module mocks ----

vi.mock("@repo/config", () => ({
	config: {
		appName: "TestApp",
		tools: {
			registry: [
				{
					slug: "invoice-processor",
					name: "Invoice Processor",
					description: "Process invoices",
					enabled: true,
					creditCost: 2,
				},
			],
		},
	},
}));

vi.mock("@saas/payments/components/UpgradeGate", () => ({
	UpgradeGate: ({
		children,
		featureName,
		description,
	}: {
		children: React.ReactNode;
		featureName?: string;
		description?: string;
	}) => (
		<div
			data-testid="upgrade-gate"
			data-feature={featureName}
			data-desc={description}
		>
			{children}
		</div>
	),
}));

vi.mock("@saas/tools/components/ToolNotes", () => ({
	ToolNotes: () => <div data-testid="tool-notes">Notes</div>,
}));
vi.mock("@saas/tools/components/ToolCollectionsPanel", () => ({
	ToolCollectionsPanel: () => (
		<div data-testid="tool-collections-panel">Collections</div>
	),
}));
vi.mock("@saas/tools/components/ToolInputTemplates", () => ({
	ToolInputTemplates: () => (
		<div data-testid="tool-input-templates">Templates</div>
	),
}));
vi.mock("@tools/components/ToolNotes", () => ({
	ToolNotes: () => <div data-testid="tool-notes">Notes</div>,
}));

// Stub remaining tool-page imports
vi.mock("@saas/credits/components/LowCreditsWarning", () => ({
	LowCreditsWarning: () => null,
}));
vi.mock("@saas/tools/components/RelatedToolsWidget", () => ({
	RelatedToolsWidget: () => null,
}));
vi.mock("@saas/tools/components/ToolPageHeader", () => ({
	ToolPageHeader: () => null,
}));
vi.mock("@saas/tools/components/ToolPersonalStats", () => ({
	ToolPersonalStats: () => (
		<div data-testid="tool-personal-stats">PersonalStats</div>
	),
}));
vi.mock("@saas/tools/components/ToolRatingWidget", () => ({
	ToolRatingWidget: () => null,
}));
vi.mock("@saas/tools/components/ToolRecentRuns", () => ({
	ToolRecentRuns: () => <div data-testid="tool-recent-runs">RecentRuns</div>,
}));
vi.mock("@saas/tools/components/ToolSampleOutput", () => ({
	ToolSampleOutput: () => null,
}));
vi.mock("@saas/tools/components/ToolScheduler", () => ({
	ToolScheduler: () => null,
}));
vi.mock("@saas/tools/components/ToolTipsBanner", () => ({
	ToolTipsBanner: () => null,
}));
vi.mock("@saas/tools/components/ToolUsageGuide", () => ({
	ToolUsageGuide: () => null,
}));
vi.mock("@saas/tools/components/ToolViewTracker", () => ({
	ToolViewTracker: () => null,
}));
vi.mock("@saas/tools/lib/tool-flags", () => ({
	isToolEnabled: vi.fn(() => true),
}));
vi.mock("@tools/components/ContractAnalyzerTool", () => ({
	ContractAnalyzerTool: () => null,
}));
vi.mock("@tools/components/ExpenseCategorizerTool", () => ({
	ExpenseCategorizerTool: () => null,
}));
vi.mock("@tools/components/FeedbackAnalyzerTool", () => ({
	FeedbackAnalyzerTool: () => null,
}));
vi.mock("@tools/components/InvoiceProcessorTool", () => ({
	InvoiceProcessorTool: () => (
		<div data-testid="invoice-processor-tool">Tool</div>
	),
}));
vi.mock("@tools/components/MeetingSummarizerTool", () => ({
	MeetingSummarizerTool: () => null,
}));
vi.mock("@tools/components/SpeakerSeparationTool", () => ({
	SpeakerSeparationTool: () => null,
}));
vi.mock("../../../../../components/tools/diagram-editor", () => ({
	DiagramEditor: () => null,
}));
vi.mock("../../../../../components/tools/news-analyzer", () => ({
	NewsAnalyzer: () => null,
}));
vi.mock("next/navigation", () => ({
	notFound: vi.fn(),
	redirect: vi.fn(),
}));

import ToolPage from "./page";

describe("ToolPage gate coverage", () => {
	async function renderToolPage() {
		const Page = await ToolPage({
			params: Promise.resolve({ toolSlug: "invoice-processor" }),
		});
		render(Page as React.ReactElement);
	}

	it("wraps ToolPersonalStats in UpgradeGate", async () => {
		await renderToolPage();
		const gates = screen.getAllByTestId("upgrade-gate");
		const statsGate = gates.find(
			(g) => g.dataset.feature === "Personal Stats",
		);
		expect(statsGate).toBeDefined();
		expect(screen.getByTestId("tool-personal-stats")).toBeInTheDocument();
	});

	it("wraps ToolRecentRuns in UpgradeGate", async () => {
		await renderToolPage();
		const gates = screen.getAllByTestId("upgrade-gate");
		const runsGate = gates.find((g) => g.dataset.feature === "Recent Runs");
		expect(runsGate).toBeDefined();
		expect(screen.getByTestId("tool-recent-runs")).toBeInTheDocument();
	});

	it("wraps ToolNotes in UpgradeGate", async () => {
		await renderToolPage();
		const gates = screen.getAllByTestId("upgrade-gate");
		const noteGate = gates.find((g) => g.dataset.feature === "Tool Notes");
		expect(noteGate).toBeDefined();
		expect(noteGate?.dataset.desc).toMatch(/tips, reminders/i);
		expect(screen.getByTestId("tool-notes")).toBeInTheDocument();
	});

	it("wraps ToolCollectionsPanel in UpgradeGate", async () => {
		await renderToolPage();
		const gates = screen.getAllByTestId("upgrade-gate");
		const colGate = gates.find(
			(g) => g.dataset.feature === "Tool Collections",
		);
		expect(colGate).toBeDefined();
		expect(
			screen.getByTestId("tool-collections-panel"),
		).toBeInTheDocument();
	});

	it("wraps ToolInputTemplates in UpgradeGate", async () => {
		await renderToolPage();
		const gates = screen.getAllByTestId("upgrade-gate");
		const tplGate = gates.find(
			(g) => g.dataset.feature === "Input Templates",
		);
		expect(tplGate).toBeDefined();
		expect(screen.getByTestId("tool-input-templates")).toBeInTheDocument();
	});
});
