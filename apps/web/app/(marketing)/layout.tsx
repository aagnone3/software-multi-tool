import { AnimatedBackground } from "@marketing/shared/components/AnimatedBackground";
import { Footer } from "@marketing/shared/components/Footer";
import { NavBar } from "@marketing/shared/components/NavBar";
import { SessionProvider } from "@saas/auth/components/SessionProvider";
import { Document } from "@shared/components/Document";
import { NextProvider as FumadocsNextProvider } from "fumadocs-core/framework/next";
import { RootProvider as FumadocsRootProvider } from "fumadocs-ui/provider";
import type { PropsWithChildren } from "react";

export default async function MarketingLayout({ children }: PropsWithChildren) {
	return (
		<Document>
			<FumadocsNextProvider>
				<FumadocsRootProvider
					search={{
						enabled: true,
						options: {
							api: "/api/docs-search",
						},
					}}
					i18n={{
						locale: "en",
					}}
				>
					<SessionProvider>
						<div className="relative min-h-screen overflow-x-hidden">
							<AnimatedBackground />
							<div className="relative z-10">
								<NavBar />
								<main>{children}</main>
								<Footer />
							</div>
						</div>
					</SessionProvider>
				</FumadocsRootProvider>
			</FumadocsNextProvider>
		</Document>
	);
}
