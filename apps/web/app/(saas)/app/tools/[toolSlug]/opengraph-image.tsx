import { config } from "@repo/config";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Tool details";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image({
	params,
}: {
	params: Promise<{ toolSlug: string }>;
}) {
	const { toolSlug } = await params;
	const tool = config.tools.registry.find((t) => t.slug === toolSlug);

	const toolName = tool?.name ?? "AI Tool";
	const toolDescription =
		tool?.description ?? "AI-powered business automation tool";
	const creditCost = tool?.creditCost ?? 1;

	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				backgroundColor: "#FAFBFC",
				backgroundImage:
					"linear-gradient(135deg, #FAFBFC 0%, #E0F2FE 50%, #FAFBFC 100%)",
				padding: "60px 80px",
				position: "relative",
			}}
		>
			{/* Header: App name */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					marginBottom: 40,
				}}
			>
				<span
					style={{
						fontSize: 28,
						fontWeight: 600,
						color: "#2563EB",
						letterSpacing: "-0.01em",
					}}
				>
					{config.appName}
				</span>
				<span
					style={{
						fontSize: 28,
						color: "#94A3B8",
						marginLeft: 12,
					}}
				>
					/ Tools
				</span>
			</div>

			{/* Tool name */}
			<div
				style={{
					display: "flex",
					fontSize: 72,
					fontWeight: 800,
					color: "#0F172A",
					letterSpacing: "-0.03em",
					lineHeight: 1.1,
					marginBottom: 24,
					maxWidth: 900,
				}}
			>
				{toolName}
			</div>

			{/* Description */}
			<div
				style={{
					display: "flex",
					fontSize: 32,
					color: "#475569",
					lineHeight: 1.4,
					maxWidth: 850,
					marginBottom: 48,
				}}
			>
				{toolDescription}
			</div>

			{/* Credit cost badge */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					backgroundColor: "#EFF6FF",
					border: "2px solid #BFDBFE",
					borderRadius: 12,
					padding: "12px 24px",
					width: "fit-content",
				}}
			>
				<span
					style={{
						fontSize: 24,
						fontWeight: 600,
						color: "#1D4ED8",
					}}
				>
					{creditCost} {creditCost === 1 ? "credit" : "credits"} per
					use
				</span>
			</div>

			{/* Bottom accent bar */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 8,
					background:
						"linear-gradient(90deg, #2563EB 0%, #3B82F6 50%, #0369A1 100%)",
				}}
			/>
		</div>,
		{
			...size,
		},
	);
}
