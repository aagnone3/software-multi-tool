import { getAllPosts } from "@marketing/blog/utils/lib/posts";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import { allLegalPages } from "content-collections";
import type { MetadataRoute } from "next";
import { docsSource } from "./docs-source";

const baseUrl = getBaseUrl();

/** Default locale (English only - i18n removed) */
const DEFAULT_LOCALE = "en";
const locales = [DEFAULT_LOCALE];

const staticMarketingPages = [""];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const posts = config.ui.blog.enabled ? await getAllPosts() : [];

	return [
		...staticMarketingPages.flatMap((page) =>
			locales.map((locale) => ({
				url: new URL(`/${locale}${page}`, baseUrl).href,
				lastModified: new Date(),
			})),
		),
		...posts.map((post) => ({
			url: new URL(`/${post.locale}/blog/${post.path}`, baseUrl).href,
			lastModified: new Date(),
		})),
		...allLegalPages.map((page: any) => ({
			url: new URL(`/${page.locale}/legal/${page.path}`, baseUrl).href,
			lastModified: new Date(),
		})),
		...docsSource.getLanguages().flatMap((locale) =>
			docsSource.getPages(locale.language).map((page) => ({
				url: new URL(
					`/${locale.language}/docs/${page.slugs.join("/")}`,
					baseUrl,
				).href,
				lastModified: new Date(),
			})),
		),
	];
}
