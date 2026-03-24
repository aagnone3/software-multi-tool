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
				<div className="mt-4 flex items-center justify-center gap-4">
					<a
						href="/feed.xml"
						className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
						aria-label="Subscribe via RSS"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19.01 7.38 20 6.18 20C4.98 20 4 19.01 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
						</svg>
						RSS Feed
					</a>
				</div>
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
