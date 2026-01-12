import { config } from "@repo/config";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { PropsWithChildren } from "react";
import { docsSource } from "../../../docs-source";

export default async function DocumentationLayout({
	children,
}: PropsWithChildren) {
	const locale = config.i18n.defaultLocale;

	return (
		<div className="pt-[4.5rem]">
			<DocsLayout
				tree={docsSource.pageTree[locale]}
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
