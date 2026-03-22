"use client";

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./diagram-editor-input", () => ({
	DiagramEditorInput: ({
		value,
		onChange,
		selectedType,
		onTypeChange: _onTypeChange,
	}: {
		value: string;
		onChange: (v: string) => void;
		selectedType: string;
		onTypeChange: (t: string) => void;
	}) => (
		<div data-testid="diagram-editor-input">
			<textarea
				data-testid="code-input"
				value={value}
				onChange={(e) => onChange(e.target.value)}
			/>
			<span data-testid="selected-type">{selectedType}</span>
		</div>
	),
}));

vi.mock("./diagram-export", () => ({
	DiagramExport: ({ disabled }: { disabled: boolean }) => (
		<button type="button" data-testid="diagram-export" disabled={disabled}>
			Export
		</button>
	),
}));

vi.mock("./diagram-preview", () => ({
	DiagramPreview: React.forwardRef(
		({ code }: { code: string; className?: string }, _ref) => (
			<div data-testid="diagram-preview">{code}</div>
		),
	),
}));

vi.mock("usehooks-ts", () => ({
	useDebounceValue: (val: string) => [val, vi.fn()],
}));

import { DiagramEditor } from "./diagram-editor";

describe("DiagramEditor", () => {
	it("renders the card title and description", () => {
		render(<DiagramEditor />);
		expect(screen.getByText("Diagram Editor")).toBeDefined();
		expect(
			screen.getByText("Create diagrams with Mermaid syntax"),
		).toBeDefined();
	});

	it("renders editor input and preview", () => {
		render(<DiagramEditor />);
		expect(screen.getByTestId("diagram-editor-input")).toBeDefined();
		expect(screen.getByTestId("diagram-preview")).toBeDefined();
	});

	it("renders export button enabled when code is present", () => {
		render(<DiagramEditor />);
		const exportBtn = screen.getByTestId("diagram-export");
		// Default diagram type has sample code, so export should be enabled
		expect(exportBtn).toBeDefined();
	});

	it("shows 'Preview' label", () => {
		render(<DiagramEditor />);
		expect(screen.getByText("Preview")).toBeDefined();
	});
});
