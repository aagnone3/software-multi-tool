import { getBaseUrl } from "@repo/utils";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	const baseUrl = getBaseUrl();

	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/app/", "/api/", "/auth/"],
			},
		],
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
