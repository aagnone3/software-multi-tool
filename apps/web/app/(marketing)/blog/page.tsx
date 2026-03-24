import { PostListItem } from "@marketing/blog/components/PostListItem";
import { getAllPosts } from "@marketing/blog/utils/lib/posts";
import { config } from "@repo/config";
import { notFound } from "next/navigation";

/** Default locale (English only - i18n removed) */
const DEFAULT_LOCALE = "en";

export async function generateMetadata() {
	const siteUrl =
		process.env.NEXT_PUBLIC_SITE_URL ?? "https://softwaremultitool.com";
	return {
		title: `Blog | ${config.appName}`,
		description:
			"Tips, tutorials, and insights on using AI tools to grow your small business. Learn how to automate invoices, meetings, contracts, and more.",
		openGraph: {
			title: `Blog | ${config.appName}`,
			description:
				"Tips, tutorials, and insights on using AI tools to grow your small business.",
			url: `${siteUrl}/blog`,
		},
		twitter: {
			card: "summary_large_image",
			title: `Blog | ${config.appName}`,
			description:
				"Tips, tutorials, and insights on using AI tools to grow your small business.",
		},
	};
}

export default async function BlogListPage() {
	// Return 404 when blog is disabled
	if (!config.ui.blog.enabled) {
		notFound();
	}

	const locale = DEFAULT_LOCALE;

	const posts = await getAllPosts();

	return (
		<div className="container max-w-6xl pt-32 pb-16">
			<div className="mb-12 pt-8 text-center">
				<h1 className="mb-2 font-bold text-5xl">
					{config.appName} Blog
				</h1>
				<p className="text-lg opacity-50">
					Tips, tutorials, and insights on AI tools for small
					businesses
				</p>
			</div>

			<div className="grid gap-8 md:grid-cols-2">
				{posts
					.filter((post) => post.published && locale === post.locale)
					.sort(
						(a, b) =>
							new Date(b.date).getTime() -
							new Date(a.date).getTime(),
					)
					.map((post) => (
						<PostListItem post={post} key={post.path} />
					))}
			</div>
		</div>
	);
}
