import { PostListItem } from "@marketing/blog/components/PostListItem";
import { getAllPosts } from "@marketing/blog/utils/lib/posts";
import { config } from "@repo/config";
import { notFound } from "next/navigation";

/** Default locale (English only - i18n removed) */
const DEFAULT_LOCALE = "en";

export async function generateMetadata() {
	return {
		title: "My awesome blog",
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
				<h1 className="mb-2 font-bold text-5xl">My awesome blog</h1>
				<p className="text-lg opacity-50">
					Read the latest news from our company
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
