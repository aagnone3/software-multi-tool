import type { Post } from "@marketing/blog/types";
import { getAllPosts } from "@marketing/blog/utils/lib/posts";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

type Props = {
	currentSlug: string;
	tags?: string[];
	limit?: number;
};

export async function RelatedPosts({
	currentSlug,
	tags = [],
	limit = 3,
}: Props) {
	const allPosts = await getAllPosts();
	const published = allPosts.filter((p) => p.published !== false);

	// Score posts by tag overlap
	const scored = published
		.filter((p) => p.path !== currentSlug)
		.map((p) => {
			const overlap = (p.tags ?? []).filter((t: string) =>
				tags.includes(t),
			).length;
			return { post: p, overlap };
		})
		.sort(
			(a, b) =>
				b.overlap - a.overlap || (b.post.date < a.post.date ? -1 : 1),
		)
		.slice(0, limit)
		.map((s) => s.post);

	if (scored.length === 0) {
		return null;
	}

	return (
		<div className="mx-auto mt-12 max-w-2xl border-t pt-10">
			<h2 className="mb-6 font-bold text-xl">Related Articles</h2>
			<div className="space-y-4">
				{scored.map((post: Post) => (
					<Link
						key={post.path}
						href={`/blog/${post.path}`}
						className="group flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
					>
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-foreground group-hover:text-primary line-clamp-2">
								{post.title}
							</p>
							{post.excerpt && (
								<p className="mt-1 text-muted-foreground text-sm line-clamp-2">
									{post.excerpt}
								</p>
							)}
						</div>
						<ArrowRightIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
					</Link>
				))}
			</div>
		</div>
	);
}
