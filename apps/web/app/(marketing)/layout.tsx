import { Footer } from "@marketing/shared/components/Footer";
import { NavBar } from "@marketing/shared/components/NavBar";
import { SessionProvider } from "@saas/auth/components/SessionProvider";
import { Document } from "@shared/components/Document";
import { NextProvider as FumadocsNextProvider } from "fumadocs-core/framework/next";
import { RootProvider as FumadocsRootProvider } from "fumadocs-ui/provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { PropsWithChildren } from "react";

export default async function MarketingLayout({ children }: PropsWithChildren) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<Document locale={locale}>
			<NextIntlClientProvider messages={messages}>
				<FumadocsNextProvider>
					<FumadocsRootProvider
						search={{
							enabled: true,
							options: {
								api: "/api/docs-search",
							},
						}}
					>
						<SessionProvider>
							<NavBar />
							<main className="min-h-screen">{children}</main>
							<Footer />
						</SessionProvider>
					</FumadocsRootProvider>
				</FumadocsNextProvider>
			</NextIntlClientProvider>
		</Document>
	);
}
