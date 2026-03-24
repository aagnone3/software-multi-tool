import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mockPush }),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({
		activeOrganization: null,
	}),
}));

vi.mock("@repo/config", () => ({
	config: { organizations: { enable: false } },
}));

import { KeyboardNavigationShortcuts } from "./KeyboardNavigationShortcuts";

describe("KeyboardNavigationShortcuts", () => {
	beforeEach(() => {
		mockPush.mockClear();
	});

	it("renders nothing", () => {
		const { container } = render(<KeyboardNavigationShortcuts />);
		expect(container.firstChild).toBeNull();
	});

	it("navigates to dashboard on G then H", async () => {
		render(<KeyboardNavigationShortcuts />);
		await userEvent.keyboard("g");
		await userEvent.keyboard("h");
		expect(mockPush).toHaveBeenCalledWith("/app");
	});

	it("navigates to tools on G then T", async () => {
		render(<KeyboardNavigationShortcuts />);
		await userEvent.keyboard("g");
		await userEvent.keyboard("t");
		expect(mockPush).toHaveBeenCalledWith("/app/tools");
	});

	it("navigates to job history on G then J", async () => {
		render(<KeyboardNavigationShortcuts />);
		await userEvent.keyboard("g");
		await userEvent.keyboard("j");
		expect(mockPush).toHaveBeenCalledWith("/app/jobs");
	});

	it("navigates to settings on G then S", async () => {
		render(<KeyboardNavigationShortcuts />);
		await userEvent.keyboard("g");
		await userEvent.keyboard("s");
		expect(mockPush).toHaveBeenCalledWith("/app/settings");
	});

	it("does not navigate on unknown sequence after G", async () => {
		render(<KeyboardNavigationShortcuts />);
		await userEvent.keyboard("g");
		await userEvent.keyboard("z");
		expect(mockPush).not.toHaveBeenCalled();
	});

	it("does not trigger when typing in an input", async () => {
		render(
			<>
				<input data-testid="inp" />
				<KeyboardNavigationShortcuts />
			</>,
		);
		const input = document.querySelector("input") as HTMLInputElement;
		input.focus();
		await userEvent.keyboard("g");
		await userEvent.keyboard("h");
		expect(mockPush).not.toHaveBeenCalled();
	});
});
