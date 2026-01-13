import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	sendMock: vi.fn(),
	getTemplateMock: vi.fn(),
	loggerError: vi.fn(),
}));

const { sendMock, getTemplateMock, loggerError } = mocks;

vi.mock("@repo/logs", () => ({
	logger: { error: mocks.loggerError },
}));

vi.mock("../provider", () => ({
	send: mocks.sendMock,
}));

vi.mock("./templates", () => ({
	getTemplate: mocks.getTemplateMock,
}));

import { sendEmail } from "./send";

describe("sendEmail", () => {
	beforeEach(() => {
		sendMock.mockReset();
		getTemplateMock.mockReset();
		loggerError.mockReset();
	});

	it("sends a templated email and returns true", async () => {
		getTemplateMock.mockResolvedValueOnce({
			subject: "Welcome",
			text: "Welcome text",
			html: "<p>Welcome</p>",
		});
		sendMock.mockResolvedValueOnce(undefined);

		const success = await sendEmail({
			to: "user@example.com",
			templateId: "emailVerification",
			context: { url: "https://example.com", name: "User" },
		} as any);

		expect(success).toBe(true);
		expect(sendMock).toHaveBeenCalledWith({
			to: "user@example.com",
			subject: "Welcome",
			text: "Welcome text",
			html: "<p>Welcome</p>",
		});
	});

	it("supports manual subject/text payloads", async () => {
		sendMock.mockResolvedValueOnce(undefined);

		const success = await sendEmail({
			to: "user@example.com",
			subject: "Hello",
			text: "Body",
		});

		expect(success).toBe(true);
		expect(sendMock).toHaveBeenCalledWith({
			to: "user@example.com",
			subject: "Hello",
			text: "Body",
			html: "",
		});
	});

	it("logs an error and returns false when sending fails", async () => {
		getTemplateMock.mockResolvedValueOnce({
			subject: "Hi",
			text: "Hi",
			html: "<p>Hi</p>",
		});
		const failure = new Error("send failed");
		sendMock.mockRejectedValueOnce(failure);

		const success = await sendEmail({
			to: "user@example.com",
			templateId: "emailVerification",
			context: { url: "https://example.com", name: "User" },
		} as any);

		expect(success).toBe(false);
		expect(loggerError).toHaveBeenCalledWith(failure);
	});
});
