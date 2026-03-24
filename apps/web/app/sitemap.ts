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

const staticMarketingPages = [
	"",
	"/changelog",
	"/tools",
	"/pricing",
	"/faq",
	"/use-cases",
	"/case-studies",
	"/roi-calculator",
	"/for",
	"/vs",
	"/integrations",
	"/security",
	"/partners",
];

const competitorSlugs = [
	"otter-ai",
	"fireflies-ai",
	"docparser",
	"chatgpt",
	"zapier",
	"notion-ai",
	"adobe-acrobat-ai",
	"microsoft-copilot",
	"google-gemini",
	"descript",
	"tldv",
	"fathom",
	"claude-ai",
	"loom",
	"rev",
	"sonix",
	"nanonets",
	"rossum",
	"bardeen",
	"make",
	"assemblyai",
	"deepgram",
	"hyper-ai",
	"grain",
	"abbyy",
	"aws-textract",
	"azure-ai-document",
	"eightfold-ai",
	"kofax",
	"docsumo",
	"sensible",
	"hyperscience",
	"instabase",
];

const industryPages = [
	"accountants",
	"lawyers",
	"freelancers",
	"small-businesses",
	"podcast-producers",
	"consultants",
	"hr-teams",
	"real-estate",
	"nonprofits",
	"financial-advisors",
	"insurance-professionals",
	"marketing-agencies",
	"medical-practices",
	"ecommerce",
	"law-firms",
	"ecommerce-businesses",
	"startups",
];

const enabledToolSlugs = config.tools.registry
	.filter((t) => t.enabled)
	.map((t) => t.slug);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const posts = config.ui.blog.enabled ? await getAllPosts() : [];

	return [
		...staticMarketingPages.flatMap((page) =>
			locales.map((locale) => ({
				url: new URL(`/${locale}${page}`, baseUrl).href,
				lastModified: new Date(),
			})),
		),
		...competitorSlugs.map((slug) => ({
			url: new URL(`/vs/${slug}`, baseUrl).href,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: 0.7,
		})),
		...industryPages.map((slug) => ({
			url: new URL(`/for/${slug}`, baseUrl).href,
			lastModified: new Date(),
			changeFrequency: "monthly" as const,
			priority: 0.7,
		})),
		...enabledToolSlugs.map((slug) => ({
			url: new URL(`/tools/${slug}`, baseUrl).href,
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.8,
		})),
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
