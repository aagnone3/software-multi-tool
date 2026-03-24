import { getAllPosts } from "@marketing/blog/utils/lib/posts";
import { config } from "@repo/config";
import { getBaseUrl } from "@repo/utils";

export const dynamic = "force-static";

export async function GET() {
	const baseUrl = getBaseUrl();
	const posts = await getAllPosts();

	const sortedPosts = [...posts]
		.filter((post) => post.locale === "en" && post.published)
		.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(config.appName)} Blog</title>
    <link>${baseUrl}/blog</link>
    <description>Tips, tutorials, and insights on using AI tools to grow your small business.</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${sortedPosts
		.map(
			(post) => `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/en/blog/${post.path}</link>
      <guid isPermaLink="true">${baseUrl}/en/blog/${post.path}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt ?? "")}</description>
    </item>`,
		)
		.join("\n    ")}
  </channel>
</rss>`;

	return new Response(rss, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control":
				"public, max-age=3600, stale-while-revalidate=86400",
		},
	});
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
