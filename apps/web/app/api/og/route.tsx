import { config } from "@repo/config";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const title = searchParams.get("title") ?? config.appName;
	const description = searchParams.get("description") ?? config.appTagline;

	return new ImageResponse(
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "flex-start",
				width: "100%",
				height: "100%",
				padding: "80px",
				background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
				fontFamily: "sans-serif",
			}}
		>
			{/* Logo/Brand badge */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					marginBottom: "32px",
					padding: "8px 16px",
					background: "rgba(99, 102, 241, 0.15)",
					borderRadius: "100px",
					border: "1px solid rgba(99, 102, 241, 0.3)",
				}}
			>
				<span
					style={{
						color: "#818cf8",
						fontSize: "18px",
						fontWeight: "600",
					}}
				>
					{config.appName}
				</span>
			</div>

			{/* Title */}
			<h1
				style={{
					color: "#f8fafc",
					fontSize: title.length > 40 ? "48px" : "64px",
					fontWeight: "700",
					lineHeight: "1.1",
					margin: "0 0 24px 0",
					maxWidth: "900px",
				}}
			>
				{title}
			</h1>

			{/* Description */}
			<p
				style={{
					color: "#94a3b8",
					fontSize: "28px",
					fontWeight: "400",
					lineHeight: "1.5",
					margin: "0",
					maxWidth: "800px",
				}}
			>
				{description}
			</p>

			{/* Bottom decoration */}
			<div
				style={{
					position: "absolute",
					bottom: "80px",
					right: "80px",
					display: "flex",
					alignItems: "center",
					gap: "8px",
					color: "#64748b",
					fontSize: "20px",
				}}
			>
				{config.appName}
			</div>
		</div>,
		{
			width: 1200,
			height: 630,
		},
	);
}
