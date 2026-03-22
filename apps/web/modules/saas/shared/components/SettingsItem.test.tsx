import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { SettingsItem } from "./SettingsItem";

describe("SettingsItem", () => {
	it("renders title", () => {
		render(<SettingsItem title="My Setting">content</SettingsItem>);
		expect(screen.getByText("My Setting")).toBeInTheDocument();
	});

	it("renders description when provided", () => {
		render(
			<SettingsItem
				title="My Setting"
				description="A helpful description"
			>
				content
			</SettingsItem>,
		);
		expect(screen.getByText("A helpful description")).toBeInTheDocument();
	});

	it("renders children", () => {
		render(
			<SettingsItem title="My Setting">
				<span>child content</span>
			</SettingsItem>,
		);
		expect(screen.getByText("child content")).toBeInTheDocument();
	});

	it("applies danger class when danger=true", () => {
		render(
			<SettingsItem title="Danger Zone" danger>
				content
			</SettingsItem>,
		);
		const heading = screen.getByText("Danger Zone");
		expect(heading.className).toContain("text-destructive");
	});

	it("does not apply danger class by default", () => {
		render(<SettingsItem title="Normal">content</SettingsItem>);
		const heading = screen.getByText("Normal");
		expect(heading.className).not.toContain("text-destructive");
	});
});
