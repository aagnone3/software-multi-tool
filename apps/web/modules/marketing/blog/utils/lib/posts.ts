import type { Post } from "@marketing/blog/types";
import { allPosts } from "content-collections";

/**
 * Returns a post's image URL, falling back to a dynamically generated OG image
 * via /api/og when the post has no explicit image set.
 *
 * Uses a relative URL (/api/og?...) so it works in all environments
 * (production, preview, local) without env vars or next.config remotePatterns.
 * Next.js <Image> handles same-origin relative paths natively.
 */
function withDefaultImage(post: Post): Post {
	if (post.image) {
		return post;
	}
	const params = new URLSearchParams({
		title: post.title,
		description: post.excerpt ?? "",
	});
	return { ...post, image: `/api/og?${params.toString()}` };
}

export async function getAllPosts(): Promise<Post[]> {
	return Promise.resolve(allPosts.map(withDefaultImage));
}

export async function getPostBySlug(
	slug: string,
	options?: {
		locale?: string;
	},
): Promise<Post | null> {
	const post = allPosts.find(
		(p: any) =>
			p.path === slug &&
			(!options?.locale || p.locale === options.locale),
	);
	return Promise.resolve(post ? withDefaultImage(post as Post) : null);
}
