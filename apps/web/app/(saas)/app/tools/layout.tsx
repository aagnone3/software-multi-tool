import { ToolsNavBar } from "@saas/tools/components/ToolsNavBar";
import type { PropsWithChildren } from "react";

export default function ToolsLayout({ children }: PropsWithChildren) {
	return (
		<div className="min-h-screen bg-background">
			<ToolsNavBar />
			<main className="pt-16">{children}</main>
		</div>
	);
}
