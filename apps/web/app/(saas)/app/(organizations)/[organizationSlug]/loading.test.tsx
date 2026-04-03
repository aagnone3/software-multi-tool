import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import OrgChatbotLoading from "./chatbot/loading";
import OrgFilesLoading from "./files/loading";
import OrganizationLoading from "./loading";
import OrgBillingSettingsLoading from "./settings/billing/loading";
import OrgDangerZoneLoading from "./settings/danger-zone/loading";
import OrgGeneralSettingsLoading from "./settings/general/loading";
import OrgMembersSettingsLoading from "./settings/members/loading";
import OrgUsageSettingsLoading from "./settings/usage/loading";

function hasSkeletons(container: HTMLElement) {
	return (
		container.querySelectorAll("[class*='skeleton'], .animate-pulse")
			.length > 0
	);
}

describe("Organization route loading skeletons", () => {
	it("OrganizationLoading renders skeletons", () => {
		const { container } = render(<OrganizationLoading />);
		expect(hasSkeletons(container)).toBe(true);
	});

	it("OrgFilesLoading renders skeletons", () => {
		const { container } = render(<OrgFilesLoading />);
		expect(hasSkeletons(container)).toBe(true);
	});

	it("OrgChatbotLoading renders skeletons", () => {
		const { container } = render(<OrgChatbotLoading />);
		expect(hasSkeletons(container)).toBe(true);
	});

	it("OrgGeneralSettingsLoading renders skeletons", () => {
		const { container } = render(<OrgGeneralSettingsLoading />);
		expect(hasSkeletons(container)).toBe(true);
	});

	it("OrgMembersSettingsLoading renders skeletons", () => {
		const { container } = render(<OrgMembersSettingsLoading />);
		expect(hasSkeletons(container)).toBe(true);
	});

	it("OrgBillingSettingsLoading renders skeletons", () => {
		const { container } = render(<OrgBillingSettingsLoading />);
		expect(hasSkeletons(container)).toBe(true);
	});

	it("OrgUsageSettingsLoading renders skeletons", () => {
		const { container } = render(<OrgUsageSettingsLoading />);
		expect(hasSkeletons(container)).toBe(true);
	});

	it("OrgDangerZoneLoading renders skeletons", () => {
		const { container } = render(<OrgDangerZoneLoading />);
		expect(hasSkeletons(container)).toBe(true);
	});
});
