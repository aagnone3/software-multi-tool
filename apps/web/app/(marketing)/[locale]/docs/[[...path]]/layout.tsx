import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { PropsWithChildren } from "react";
import { docsSource } from "../../../../docs-source";

export default async function DocumentationLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ locale: string }>;
}>) {
	const { locale } = await params;

	return (
		<div className="pt-[4.5rem]">
			<DocsLayout
				tree={docsSource.pageTree[locale]}
				i18n
				nav={{
					title: <strong>Documentation</strong>,
					url: "/docs",
				}}
				sidebar={{
					defaultOpenLevel: 1,
				}}
			>
				{children}
			</DocsLayout>
		</div>
	);
}
