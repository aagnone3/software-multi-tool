import { createI18nSearchAPI } from "fumadocs-core/search/server";
import { docsSource } from "../../docs-source";

/** Default locale (English only - i18n removed) */
const DEFAULT_LOCALE = "en";

export const { GET } = createI18nSearchAPI("advanced", {
	i18n: {
		defaultLanguage: DEFAULT_LOCALE,
		languages: [DEFAULT_LOCALE],
	},
	indexes: docsSource.getLanguages().flatMap((entry) =>
		entry.pages.map((page) => ({
			title: page.data.title ?? "",
			description: page.data.description ?? "",
			structuredData: (page.data as any).structuredData,
			id: page.url,
			url: page.url,
			locale: entry.language,
		})),
	),
});
