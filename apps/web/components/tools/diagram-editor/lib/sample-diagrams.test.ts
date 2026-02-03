import { describe, expect, it } from "vitest";
import {
	DEFAULT_DIAGRAM_TYPE,
	DIAGRAM_TYPE_LABELS,
	SAMPLE_DIAGRAMS,
} from "./sample-diagrams";

describe("sample-diagrams", () => {
	describe("SAMPLE_DIAGRAMS", () => {
		it("contains all expected diagram types", () => {
			expect(SAMPLE_DIAGRAMS).toHaveProperty("flowchart");
			expect(SAMPLE_DIAGRAMS).toHaveProperty("sequence");
			expect(SAMPLE_DIAGRAMS).toHaveProperty("classDiagram");
			expect(SAMPLE_DIAGRAMS).toHaveProperty("stateDiagram");
			expect(SAMPLE_DIAGRAMS).toHaveProperty("erDiagram");
			expect(SAMPLE_DIAGRAMS).toHaveProperty("gantt");
		});

		it("each diagram is a non-empty string", () => {
			for (const diagram of Object.values(SAMPLE_DIAGRAMS)) {
				expect(typeof diagram).toBe("string");
				expect(diagram.length).toBeGreaterThan(0);
			}
		});

		it("flowchart contains valid Mermaid flowchart syntax", () => {
			expect(SAMPLE_DIAGRAMS.flowchart).toContain("flowchart");
			expect(SAMPLE_DIAGRAMS.flowchart).toContain("-->");
		});

		it("sequence diagram contains valid syntax", () => {
			expect(SAMPLE_DIAGRAMS.sequence).toContain("sequenceDiagram");
			expect(SAMPLE_DIAGRAMS.sequence).toContain("participant");
		});

		it("class diagram contains valid syntax", () => {
			expect(SAMPLE_DIAGRAMS.classDiagram).toContain("classDiagram");
			expect(SAMPLE_DIAGRAMS.classDiagram).toContain("class");
		});

		it("state diagram contains valid syntax", () => {
			expect(SAMPLE_DIAGRAMS.stateDiagram).toContain("stateDiagram");
			expect(SAMPLE_DIAGRAMS.stateDiagram).toContain("[*]");
		});

		it("ER diagram contains valid syntax", () => {
			expect(SAMPLE_DIAGRAMS.erDiagram).toContain("erDiagram");
			expect(SAMPLE_DIAGRAMS.erDiagram).toMatch(/\|\|--/);
		});

		it("Gantt chart contains valid syntax", () => {
			expect(SAMPLE_DIAGRAMS.gantt).toContain("gantt");
			expect(SAMPLE_DIAGRAMS.gantt).toContain("section");
		});
	});

	describe("DIAGRAM_TYPE_LABELS", () => {
		it("has a label for each diagram type", () => {
			const diagramKeys = Object.keys(SAMPLE_DIAGRAMS);
			const labelKeys = Object.keys(DIAGRAM_TYPE_LABELS);

			expect(labelKeys).toEqual(expect.arrayContaining(diagramKeys));
			expect(labelKeys.length).toBe(diagramKeys.length);
		});

		it("all labels are non-empty strings", () => {
			for (const label of Object.values(DIAGRAM_TYPE_LABELS)) {
				expect(typeof label).toBe("string");
				expect(label.length).toBeGreaterThan(0);
			}
		});
	});

	describe("DEFAULT_DIAGRAM_TYPE", () => {
		it("is a valid diagram type", () => {
			expect(SAMPLE_DIAGRAMS).toHaveProperty(DEFAULT_DIAGRAM_TYPE);
		});

		it("defaults to flowchart", () => {
			expect(DEFAULT_DIAGRAM_TYPE).toBe("flowchart");
		});
	});
});
