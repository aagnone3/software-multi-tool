import { config } from "@repo/config";
import type { MetadataRoute } from "next";

/**
 * Web App Manifest for PWA support.
 * Defines app metadata for installation on mobile devices.
 *
 * Brand colors from theme.css:
 * - Primary: #2563EB (blue)
 * - Background: #FAFBFC (light)
 * - Dark Background: #0F172A
 */
export default function manifest(): MetadataRoute.Manifest {
	return {
		name: config.appName,
		short_name: "SoftwareMultitool",
		description: "AI-powered tools for productivity and automation",
		start_url: "/",
		display: "standalone",
		background_color: "#FAFBFC",
		theme_color: "#2563EB",
		icons: [
			{
				src: "/icon.png",
				sizes: "any",
				type: "image/png",
			},
			{
				src: "/apple-icon",
				sizes: "180x180",
				type: "image/png",
			},
		],
	};
}
