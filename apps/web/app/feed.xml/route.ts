import { getAllPosts } from "@marketing/blog/utils/lib/posts";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

function escapeXml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export async function GET() {
	const baseUrl = getBaseUrl();
	const posts = config.ui.blog.enabled
		? (await getAllPosts()).filter((p) => p.published)
		: [];

	// RSS feed is English-only
	const englishPosts = posts.filter((p) => !p.locale || p.locale === "en");

	const sortedPosts = englishPosts.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	const items = sortedPosts
		.slice(0, 20)
		.map((post) => {
			const postUrl = `${baseUrl}/blog/${post.path}`;
			const pubDate = new Date(post.date).toUTCString();
			const description = post.excerpt ? escapeXml(post.excerpt) : "";
			const categories = (post.tags ?? [])
				.map((tag) => `<category>${escapeXml(tag)}</category>`)
				.join("\n    ");

			return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${postUrl}</link>
    <guid isPermaLink="true">${postUrl}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${description}</description>
    ${categories}
    ${post.authorName ? `<author>${escapeXml(post.authorName)}</author>` : ""}
  </item>`;
		})
		.join("\n");

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.appName)} Blog</title>
    <link>${baseUrl}/blog</link>
    <description>${escapeXml(config.appDescription ?? "AI-powered business tools for small teams.")} Latest articles and guides.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>${escapeXml(config.appName)}</title>
      <link>${baseUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

	return new NextResponse(rss, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
		},
	});
}
