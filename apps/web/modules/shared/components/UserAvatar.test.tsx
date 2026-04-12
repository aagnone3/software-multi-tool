import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
	config: {
		storage: {
			bucketNames: {
				avatars: "avatars",
			},
		},
	},
}));

vi.mock("@ui/components/avatar", () => ({
	Avatar: ({ children, className }: any) => (
		<div data-testid="avatar" className={className}>
			{children}
		</div>
	),
	AvatarImage: ({ src }: any) => (
		<img data-testid="avatar-image" src={src} alt="" />
	),
	AvatarFallback: ({ children }: any) => (
		<span data-testid="avatar-fallback">{children}</span>
	),
}));

describe("UserAvatar", () => {
	it("renders initials from single name", async () => {
		const { UserAvatar } = await import("./UserAvatar");
		render(<UserAvatar name="John" />);
		expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("J");
	});

	it("renders initials from two-word name", async () => {
		const { UserAvatar } = await import("./UserAvatar");
		render(<UserAvatar name="John Doe" />);
		expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("JD");
	});

	it("renders only first two word initials for long names", async () => {
		const { UserAvatar } = await import("./UserAvatar");
		render(<UserAvatar name="John Michael Doe" />);
		expect(screen.getByTestId("avatar-fallback")).toHaveTextContent("JM");
	});

	it("passes absolute URL directly to AvatarImage", async () => {
		const { UserAvatar } = await import("./UserAvatar");
		render(
			<UserAvatar
				name="John"
				avatarUrl="https://example.com/avatar.png"
			/>,
		);
		expect(screen.getByTestId("avatar-image")).toHaveAttribute(
			"src",
			"https://example.com/avatar.png",
		);
	});

	it("uses image-proxy path for relative avatar URL", async () => {
		const { UserAvatar } = await import("./UserAvatar");
		render(<UserAvatar name="John" avatarUrl="relative/path.png" />);
		expect(screen.getByTestId("avatar-image")).toHaveAttribute(
			"src",
			"/image-proxy/avatars/relative/path.png",
		);
	});

	it("renders no image src when avatarUrl is null", async () => {
		const { UserAvatar } = await import("./UserAvatar");
		render(<UserAvatar name="John" avatarUrl={null} />);
		expect(screen.getByTestId("avatar-image")).not.toHaveAttribute("src");
	});

	it("applies className to Avatar", async () => {
		const { UserAvatar } = await import("./UserAvatar");
		render(<UserAvatar name="John" className="custom-class" />);
		expect(screen.getByTestId("avatar")).toHaveClass("custom-class");
	});
});
