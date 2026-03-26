import type { Post } from "@marketing/blog/types";
import { getBaseUrl } from "@repo/utils";
import { allPosts } from "content-collections";

/**
 * Returns a post's image URL, falling back to a dynamically generated OG image
 * via /api/og when the post has no explicit image set.
 * This ensures every blog post has a proper branded cover image.
 */
function withDefaultImage(post: Post): Post {
	if (post.image) {
		return post;
	}
	const baseUrl = getBaseUrl();
	const params = new URLSearchParams({
		title: post.title,
		description: post.excerpt ?? "",
	});
	return { ...post, image: `${baseUrl}/api/og?${params.toString()}` };
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
