import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
	config: {
		i18n: {
			defaultLocale: "en",
			locales: {
				en: { label: "English", currency: "USD" },
				de: { label: "Deutsch", currency: "EUR" },
			},
		},
	},
}));

describe("messages helpers", () => {
	afterEach(() => {
		vi.doUnmock("../translations/en.json");
		vi.doUnmock("../translations/de.json");
		vi.resetModules();
	});

	it("loads locale translations directly", async () => {
		const { importLocale } = await import("./messages");
		const messages = await importLocale("en");

		expect(messages).toHaveProperty("common");
	});

	it("returns locale messages directly for default locale", async () => {
		const { getMessagesForLocale } = await import("./messages");

		const messages = await getMessagesForLocale("en");

		expect(messages).toHaveProperty("common");
	});

	it("merges non-default locale messages with defaults", async () => {
		vi.doMock("../translations/en.json", () => ({
			default: {
				shared: { title: "English Title" },
			},
		}));
		vi.doMock("../translations/de.json", () => ({
			default: {
				shared: {},
			},
		}));

		const { getMessagesForLocale } = await import("./messages");

		const messages = await getMessagesForLocale("de");

		expect(messages.shared.title).toBe("English Title");
	});
});
