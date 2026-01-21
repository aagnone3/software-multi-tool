import {
	Container,
	Font,
	Head,
	Html,
	Section,
	Tailwind,
} from "@react-email/components";
import React, { type PropsWithChildren } from "react";
import { Logo } from "./Logo";

/**
 * Email wrapper component with brand styling.
 *
 * Brand colors aligned with tooling/tailwind/theme.css:
 * - Primary: #2563EB (blue - professional & trustworthy)
 * - Secondary: #1E293B (slate - strong contrast)
 * - Background: #FAFBFC (light gray)
 * - Foreground: #0F172A (dark slate)
 * - Muted: #64748B (subtle text)
 * - Border: #E2E8F0 (light border)
 */
export default function Wrapper({ children }: PropsWithChildren) {
	return (
		<Html lang="en">
			<Head>
				<Font
					fontFamily="Inter"
					fallbackFontFamily="Arial"
					fontWeight={400}
					fontStyle="normal"
				/>
			</Head>
			<Tailwind
				config={{
					theme: {
						extend: {
							colors: {
								border: "#E2E8F0",
								background: "#FAFBFC",
								foreground: "#0F172A",
								muted: {
									DEFAULT: "#F1F5F9",
									foreground: "#64748B",
								},
								primary: {
									DEFAULT: "#2563EB",
									foreground: "#FFFFFF",
								},
								secondary: {
									DEFAULT: "#1E293B",
									foreground: "#FFFFFF",
								},
								card: {
									DEFAULT: "#FFFFFF",
									foreground: "#0F172A",
								},
							},
						},
					},
				}}
			>
				<Section className="bg-background p-4">
					<Container className="rounded-lg bg-card p-6 text-card-foreground">
						<Logo />
						{children}
					</Container>
				</Section>
			</Tailwind>
		</Html>
	);
}
