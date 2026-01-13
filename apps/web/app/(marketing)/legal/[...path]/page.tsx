import { PostContent } from "@marketing/blog/components/PostContent";
import {
	getActivePathFromUrlParam,
	getLocalizedDocumentWithFallback,
} from "@shared/lib/content";
import { allLegalPages } from "content-collections";
import { redirect } from "next/navigation";

/** Default locale (English only - i18n removed) */
const DEFAULT_LOCALE = "en";

type Params = {
	path: string;
};

export async function generateMetadata(props: { params: Promise<Params> }) {
	const params = await props.params;

	const { path } = params;

	const locale = DEFAULT_LOCALE;
	const activePath = getActivePathFromUrlParam(path);
	const page = getLocalizedDocumentWithFallback(
		allLegalPages,
		activePath,
		locale,
	);

	return {
		title: (page as any)?.title,
		openGraph: {
			title: (page as any)?.title,
		},
	};
}

export default async function LegalPage(props: { params: Promise<Params> }) {
	const params = await props.params;

	const { path } = params;

	const locale = DEFAULT_LOCALE;
	const activePath = getActivePathFromUrlParam(path);
	const page = getLocalizedDocumentWithFallback(
		allLegalPages,
		activePath,
		locale,
	);

	if (!page) {
		redirect("/");
	}

	const { title, body } = page as any;

	return (
		<div className="container max-w-6xl pt-32 pb-24">
			<div className="mx-auto mb-12 max-w-2xl">
				<h1 className="text-center font-bold text-4xl">{title}</h1>
			</div>

			<PostContent content={body} />
		</div>
	);
}
