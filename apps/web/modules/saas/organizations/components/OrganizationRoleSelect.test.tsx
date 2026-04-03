import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { OrganizationRoleSelect } from "./OrganizationRoleSelect";

vi.mock("@saas/organizations/hooks/member-roles", () => ({
	useOrganizationMemberRoles: () => ({
		owner: "Owner",
		admin: "Admin",
		member: "Member",
	}),
}));

vi.mock("@ui/components/select", () => ({
	Select: ({
		children,
		value,
		onValueChange,
		disabled,
	}: {
		children: React.ReactNode;
		value: string;
		onValueChange: (v: string) => void;
		disabled?: boolean;
	}) => (
		<button
			type="button"
			data-testid="select"
			data-value={value}
			data-disabled={disabled}
			onClick={() => onValueChange("admin")}
		>
			{children}
		</button>
	),
	SelectTrigger: ({
		children,
		"aria-label": ariaLabel,
	}: {
		children: React.ReactNode;
		"aria-label"?: string;
	}) => (
		<button type="button" data-testid="trigger" aria-label={ariaLabel}>
			{children}
		</button>
	),
	SelectValue: () => <span data-testid="value" />,
	SelectContent: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="content">{children}</div>
	),
	SelectItem: ({
		children,
		value,
	}: {
		children: React.ReactNode;
		value: string;
	}) => <div data-testid={`item-${value}`}>{children}</div>,
}));

describe("OrganizationRoleSelect", () => {
	it("renders all role options", () => {
		render(<OrganizationRoleSelect value="member" onSelect={() => {}} />);
		expect(screen.getByTestId("item-owner")).toHaveTextContent("Owner");
		expect(screen.getByTestId("item-admin")).toHaveTextContent("Admin");
		expect(screen.getByTestId("item-member")).toHaveTextContent("Member");
	});

	it("calls onSelect when value changes", () => {
		const onSelect = vi.fn();
		render(<OrganizationRoleSelect value="member" onSelect={onSelect} />);
		screen.getByTestId("select").click();
		expect(onSelect).toHaveBeenCalledWith("admin");
	});

	it("has accessible aria-label on select trigger", () => {
		render(<OrganizationRoleSelect value="member" onSelect={() => {}} />);
		expect(screen.getByTestId("trigger")).toHaveAttribute(
			"aria-label",
			"Member role",
		);
	});

	it("passes disabled to Select", () => {
		render(
			<OrganizationRoleSelect
				value="owner"
				onSelect={() => {}}
				disabled
			/>,
		);
		expect(screen.getByTestId("select")).toHaveAttribute(
			"data-disabled",
			"true",
		);
	});
});
