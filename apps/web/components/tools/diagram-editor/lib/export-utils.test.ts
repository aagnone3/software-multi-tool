import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock DOMPurify
vi.mock("dompurify", () => ({
	default: {
		sanitize: vi.fn((str: string) => str),
	},
}));

// Helper to create a container with an SVG child
function createContainerWithSvg(svgWidth = 100, svgHeight = 100): HTMLElement {
	const container = document.createElement("div");
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("width", String(svgWidth));
	svg.setAttribute("height", String(svgHeight));
	vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
		width: svgWidth,
		height: svgHeight,
		top: 0,
		left: 0,
		right: svgWidth,
		bottom: svgHeight,
		x: 0,
		y: 0,
		toJSON: () => ({}),
	});
	container.appendChild(svg);
	return container;
}

function createEmptyContainer(): HTMLElement {
	return document.createElement("div");
}

describe("export-utils", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.URL.createObjectURL = vi.fn().mockReturnValue("blob:fake-url");
		global.URL.revokeObjectURL = vi.fn();
	});

	describe("copySvgToClipboard", () => {
		it("throws when no SVG found in container", async () => {
			const { copySvgToClipboard } = await import("./export-utils");
			const container = createEmptyContainer();
			await expect(copySvgToClipboard(container)).rejects.toThrow(
				"No SVG element found",
			);
		});

		it("writes sanitized SVG string to clipboard", async () => {
			const { copySvgToClipboard } = await import("./export-utils");
			const writeTextMock = vi.fn().mockResolvedValue(undefined);
			vi.stubGlobal("navigator", {
				...navigator,
				clipboard: { writeText: writeTextMock },
			});

			const container = createContainerWithSvg();
			await copySvgToClipboard(container);

			expect(writeTextMock).toHaveBeenCalledOnce();
			expect(writeTextMock).toHaveBeenCalledWith(
				expect.stringContaining("svg"),
			);
		});
	});

	describe("downloadSvg", () => {
		it("throws when no SVG found in container", async () => {
			const { downloadSvg } = await import("./export-utils");
			const container = createEmptyContainer();
			expect(() => downloadSvg(container)).toThrow(
				"No SVG element found",
			);
		});

		it("creates an object URL and revokes it after download", async () => {
			const { downloadSvg } = await import("./export-utils");

			const container = createContainerWithSvg();
			downloadSvg(container, { filename: "test-diagram.svg" });

			expect(URL.createObjectURL).toHaveBeenCalledOnce();
			expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
		});
	});

	describe("copyPngToClipboard", () => {
		it("throws when no SVG found in container", async () => {
			const { copyPngToClipboard } = await import("./export-utils");
			const container = createEmptyContainer();
			await expect(copyPngToClipboard(container)).rejects.toThrow(
				"No SVG element found",
			);
		});
	});

	describe("downloadPng", () => {
		it("throws when no SVG found in container", async () => {
			const { downloadPng } = await import("./export-utils");
			const container = createEmptyContainer();
			await expect(downloadPng(container)).rejects.toThrow(
				"No SVG element found",
			);
		});
	});
});
