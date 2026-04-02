import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingStep2 } from "./OnboardingStep2";

const mockTrack = vi.hoisted(() => vi.fn());
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

// Mock config to control which tools are enabled
vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{ slug: "meeting-summarizer", enabled: true },
				{ slug: "invoice-processor", enabled: true },
				{ slug: "contract-analyzer", enabled: true },
				{ slug: "expense-categorizer", enabled: true },
				{ slug: "feedback-analyzer", enabled: false },
				{ slug: "speaker-separation", enabled: true },
				{ slug: "news-analyzer", enabled: true },
			],
		},
	},
}));

// Mock next/link
vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		onClick,
	}: {
		href: string;
		children: React.ReactNode;
		onClick?: () => void;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

describe("OnboardingStep2", () => {
	const onCompleted = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the heading and subheading", () => {
		render(<OnboardingStep2 onCompleted={onCompleted} />);
		expect(
			screen.getByText("Which tool sounds most useful to you?"),
		).toBeDefined();
		expect(screen.getByText(/We'll send you there first/)).toBeDefined();
	});

	it("renders only enabled tools from config", () => {
		render(<OnboardingStep2 onCompleted={onCompleted} />);
		// feedback-analyzer is disabled, should not appear
		expect(screen.getByText("Summarize meetings")).toBeDefined();
		expect(screen.getByText("Process invoices")).toBeDefined();
		expect(screen.queryByText("Analyze customer feedback")).toBeNull();
	});

	it("shows 'Go to dashboard' CTA when no tool is selected", () => {
		render(<OnboardingStep2 onCompleted={onCompleted} />);
		expect(
			screen.getByRole("button", { name: /Go to dashboard/ }),
		).toBeDefined();
	});

	it("shows 'Skip for now' link when no tool is selected", () => {
		render(<OnboardingStep2 onCompleted={onCompleted} />);
		expect(screen.getByText("Skip for now")).toBeDefined();
	});

	it("selecting a tool replaces Go-to-dashboard CTA with a Try link", async () => {
		const user = userEvent.setup();
		render(<OnboardingStep2 onCompleted={onCompleted} />);

		await user.click(screen.getByText("Summarize meetings"));

		// CTA should now be a link to the tool
		const link = screen.getByRole("link");
		expect(link.getAttribute("href")).toContain("meeting-summarizer");
		// Go to dashboard button should be gone
		expect(
			screen.queryByRole("button", { name: /Go to dashboard/ }),
		).toBeNull();
	});

	it("'Skip for now' disappears after tool selection", async () => {
		const user = userEvent.setup();
		render(<OnboardingStep2 onCompleted={onCompleted} />);

		await user.click(screen.getByText("Process invoices"));

		expect(screen.queryByText("Skip for now")).toBeNull();
	});

	it("clicking 'Go to dashboard' calls onCompleted", async () => {
		const user = userEvent.setup();
		render(<OnboardingStep2 onCompleted={onCompleted} />);

		await user.click(
			screen.getByRole("button", { name: /Go to dashboard/ }),
		);

		expect(onCompleted).toHaveBeenCalledOnce();
	});

	it("clicking 'Skip for now' calls onCompleted", async () => {
		const user = userEvent.setup();
		render(<OnboardingStep2 onCompleted={onCompleted} />);

		await user.click(screen.getByText("Skip for now"));

		expect(onCompleted).toHaveBeenCalledOnce();
	});

	it("clicking the Try CTA link calls onCompleted", async () => {
		const user = userEvent.setup();
		render(<OnboardingStep2 onCompleted={onCompleted} />);

		await user.click(screen.getByText("Summarize meetings"));
		const link = screen.getByRole("link");
		await user.click(link);

		expect(onCompleted).toHaveBeenCalledOnce();
	});

	it("tracks onboarding_step2_tool_selected when a tool is clicked", async () => {
		const user = userEvent.setup();
		render(<OnboardingStep2 onCompleted={onCompleted} />);

		await user.click(screen.getByText("Process invoices"));

		expect(mockTrack).toHaveBeenCalledWith({
			name: "onboarding_step2_tool_selected",
			props: { tool_slug: "invoice-processor" },
		});
	});

	it("tracks onboarding_step2_skipped and completed with skipped=true when Skip is clicked", async () => {
		const user = userEvent.setup();
		render(<OnboardingStep2 onCompleted={onCompleted} />);

		await user.click(screen.getByText("Skip for now"));

		expect(mockTrack).toHaveBeenCalledWith({
			name: "onboarding_step2_skipped",
			props: {},
		});
		expect(mockTrack).toHaveBeenCalledWith({
			name: "onboarding_step2_completed",
			props: { tool_slug: null, skipped: true },
		});
	});

	it("tracks onboarding_step2_completed with tool_slug when Try CTA is clicked", async () => {
		const user = userEvent.setup();
		render(<OnboardingStep2 onCompleted={onCompleted} />);

		await user.click(screen.getByText("Summarize meetings"));
		const link = screen.getByRole("link");
		await user.click(link);

		expect(mockTrack).toHaveBeenCalledWith({
			name: "onboarding_step2_completed",
			props: { tool_slug: "meeting-summarizer", skipped: false },
		});
	});
});
