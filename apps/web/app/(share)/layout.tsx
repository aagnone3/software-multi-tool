import { Document } from "@shared/components/Document";
import type { PropsWithChildren } from "react";

export default async function ShareLayout({ children }: PropsWithChildren) {
	return (
		<Document>
			<main className="min-h-screen bg-background">{children}</main>
		</Document>
	);
}
