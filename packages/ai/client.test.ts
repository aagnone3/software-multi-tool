import { describe, expect, it, vi } from "vitest";

const hookMock = vi.fn();

vi.mock("@ai-sdk/react", () => ({
	useChat: hookMock,
}));

describe("client re-exports", () => {
	it("forwards hooks from @ai-sdk/react", async () => {
		const { useChat } = await import("./client");

		expect(useChat).toBe(hookMock);
	});
});
