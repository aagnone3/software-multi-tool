import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { SettingsList } from "./SettingsList";

describe("SettingsList", () => {
	it("renders single child", () => {
		render(
			<SettingsList>
				<span>item one</span>
			</SettingsList>,
		);
		expect(screen.getByText("item one")).toBeInTheDocument();
	});

	it("renders multiple children", () => {
		render(
			<SettingsList>
				<span>item one</span>
				<span>item two</span>
				<span>item three</span>
			</SettingsList>,
		);
		expect(screen.getByText("item one")).toBeInTheDocument();
		expect(screen.getByText("item two")).toBeInTheDocument();
		expect(screen.getByText("item three")).toBeInTheDocument();
	});

	it("filters out falsy children", () => {
		render(
			<SettingsList>
				<span>visible</span>
				{false}
				{null}
			</SettingsList>,
		);
		expect(screen.getByText("visible")).toBeInTheDocument();
	});
});
