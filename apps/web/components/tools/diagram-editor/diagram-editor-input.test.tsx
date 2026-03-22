import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DiagramEditorInput } from "./diagram-editor-input";
import { SAMPLE_DIAGRAMS } from "./lib/sample-diagrams";

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		onClick,
		...props
	}: React.ComponentProps<"button">) => (
		<button type="button" onClick={onClick} {...props}>
			{children}
		</button>
	),
}));

vi.mock("@ui/components/label", () => ({
	Label: ({ children }: React.ComponentProps<"label">) => (
		<span>{children}</span>
	),
}));

vi.mock("@ui/components/textarea", () => ({
	Textarea: (props: React.ComponentProps<"textarea">) => (
		<textarea {...props} />
	),
}));

vi.mock("@ui/components/select", () => ({
	Select: ({
		children,
		onValueChange,
	}: {
		children: React.ReactNode;
		value: string;
		onValueChange: (v: string) => void;
	}) => (
		<div>
			<button type="button" onClick={() => onValueChange("sequence")}>
				change-to-sequence
			</button>
			{children}
		</div>
	),
	SelectTrigger: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SelectValue: ({ placeholder }: { placeholder: string }) => (
		<span>{placeholder}</span>
	),
	SelectContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	SelectItem: ({
		children,
		value,
	}: {
		children: React.ReactNode;
		value: string;
	}) => <div data-value={value}>{children}</div>,
}));

describe("DiagramEditorInput", () => {
	const defaultProps = {
		value: "graph TD\nA --> B",
		onChange: vi.fn(),
		selectedType: "flowchart" as const,
		onTypeChange: vi.fn(),
	};

	it("renders textarea with current value", () => {
		render(<DiagramEditorInput {...defaultProps} />);
		const textarea = screen.getByPlaceholderText(
			"Enter Mermaid diagram syntax...",
		);
		expect(textarea).toBeInTheDocument();
	});

	it("renders Mermaid Syntax label", () => {
		render(<DiagramEditorInput {...defaultProps} />);
		expect(screen.getByText("Mermaid Syntax")).toBeInTheDocument();
	});

	it("renders Diagram Type label", () => {
		render(<DiagramEditorInput {...defaultProps} />);
		expect(screen.getByText("Diagram Type")).toBeInTheDocument();
	});

	it("calls onChange when textarea changes", async () => {
		const onChange = vi.fn();
		render(<DiagramEditorInput {...defaultProps} onChange={onChange} />);
		const textarea = screen.getByPlaceholderText(
			"Enter Mermaid diagram syntax...",
		);
		await userEvent.type(textarea, "x");
		expect(onChange).toHaveBeenCalled();
	});

	it("resets to sample diagram when reset button clicked", async () => {
		const onChange = vi.fn();
		render(<DiagramEditorInput {...defaultProps} onChange={onChange} />);
		const resetBtn = screen.getByRole("button", { name: /reset/i });
		await userEvent.click(resetBtn);
		expect(onChange).toHaveBeenCalledWith(SAMPLE_DIAGRAMS.flowchart);
	});

	it("calls onTypeChange and onChange when type changes", async () => {
		const onChange = vi.fn();
		const onTypeChange = vi.fn();
		render(
			<DiagramEditorInput
				{...defaultProps}
				onChange={onChange}
				onTypeChange={onTypeChange}
			/>,
		);
		await userEvent.click(screen.getByText("change-to-sequence"));
		expect(onTypeChange).toHaveBeenCalledWith("sequence");
		expect(onChange).toHaveBeenCalledWith(SAMPLE_DIAGRAMS.sequence);
	});

	it("renders mermaid.js.org link", () => {
		render(<DiagramEditorInput {...defaultProps} />);
		const link = screen.getByRole("link", { name: /mermaid\.js\.org/i });
		expect(link).toHaveAttribute("href", "https://mermaid.js.org/intro/");
	});
});
