import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { SidebarContentLayout } from "./SidebarContentLayout";

describe("SidebarContentLayout", () => {
	it("renders children", () => {
		render(
			<SidebarContentLayout sidebar={<div>Sidebar</div>}>
				<span>Main content</span>
			</SidebarContentLayout>,
		);
		expect(screen.getByText("Main content")).toBeTruthy();
	});

	it("renders sidebar", () => {
		render(
			<SidebarContentLayout sidebar={<div>Side panel</div>}>
				<span>Content</span>
			</SidebarContentLayout>,
		);
		expect(screen.getByText("Side panel")).toBeTruthy();
	});

	it("renders both sidebar and children in the same container", () => {
		const { container } = render(
			<SidebarContentLayout
				sidebar={<div data-testid="sidebar">Sidebar</div>}
			>
				<div data-testid="main">Main</div>
			</SidebarContentLayout>,
		);
		expect(container.querySelector("[data-testid='sidebar']")).toBeTruthy();
		expect(container.querySelector("[data-testid='main']")).toBeTruthy();
	});

	it("accepts multiple children", () => {
		render(
			<SidebarContentLayout sidebar={<span>Sidebar</span>}>
				<span>Child 1</span>
				<span>Child 2</span>
			</SidebarContentLayout>,
		);
		expect(screen.getByText("Child 1")).toBeTruthy();
		expect(screen.getByText("Child 2")).toBeTruthy();
	});
});
