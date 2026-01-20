import { PostContent } from "@marketing/blog/components/PostContent";
import { getPostBySlug } from "@marketing/blog/utils/lib/posts";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import { getActivePathFromUrlParam } from "@shared/lib/content";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

/** Default locale (English only - i18n removed) */
const DEFAULT_LOCALE = "en";

type Params = {
	path: string;
};

export async function generateMetadata(props: { params: Promise<Params> }) {
	const params = await props.params;

	const { path } = params;

	const locale = DEFAULT_LOCALE;
	const slug = getActivePathFromUrlParam(path);
	const post = await getPostBySlug(slug, { locale });

	return {
		title: post?.title,
		description: post?.excerpt,
		openGraph: {
			title: post?.title,
			description: post?.excerpt,
			images: post?.image
				? [
						post.image.startsWith("http")
							? post.image
							: new URL(post.image, getBaseUrl()).toString(),
					]
				: [],
		},
	};
}

export default async function BlogPostPage(props: { params: Promise<Params> }) {
	// Return 404 when blog is disabled
	if (!config.ui.blog.enabled) {
		notFound();
	}

	const { path } = await props.params;
	const locale = DEFAULT_LOCALE;

	const slug = getActivePathFromUrlParam(path);
	const post = await getPostBySlug(slug, { locale });

	if (!post) {
		return redirect("/blog");
	}

	const { title, date, authorName, authorImage, tags, image, body } = post;

	return (
		<div className="container max-w-6xl pt-32 pb-24">
			<div className="mx-auto max-w-2xl">
				<div className="mb-12">
					<Link href="/blog">&larr; Back to blog</Link>
				</div>

				<h1 className="font-bold text-4xl">{title}</h1>

				<div className="mt-4 flex items-center justify-start gap-6">
					{authorName && (
						<div className="flex items-center">
							{authorImage && (
								<div className="relative mr-2 size-8 overflow-hidden rounded-full">
									<Image
										src={authorImage}
										alt={authorName}
										fill
										sizes="96px"
										className="object-cover object-center"
									/>
								</div>
							)}
							<div>
								<p className="font-semibold text-sm opacity-50">
									{authorName}
								</p>
							</div>
						</div>
					)}

					<div className="mr-0 ml-auto">
						<p className="text-sm opacity-30">
							{Intl.DateTimeFormat("en-US").format(
								new Date(date),
							)}
						</p>
					</div>

					{tags && (
						<div className="flex flex-1 flex-wrap gap-2">
							{tags.map((tag: string) => (
								<span
									key={tag}
									className="font-semibold text-primary text-xs uppercase tracking-wider"
								>
									#{tag}
								</span>
							))}
						</div>
					)}
				</div>
			</div>

			{image && (
				<div className="relative mt-6 aspect-16/9 overflow-hidden rounded-xl">
					<Image
						src={image}
						alt={title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
						className="object-cover object-center"
					/>
				</div>
			)}

			<div className="pb-8">
				<PostContent content={body} />
			</div>
		</div>
	);
}
