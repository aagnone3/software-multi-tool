import { PageHeader } from "@saas/shared/components/PageHeader";
import { ToolsGrid } from "@saas/tools/components/ToolsGrid";
import { Button } from "@ui/components/button";
import { GitCompareArrowsIcon } from "lucide-react";
import Link from "next/link";

export default function ToolsPage() {
	return (
		<div>
			<PageHeader
				title="Tools"
				subtitle="Explore our collection of AI-powered utilities"
				actions={
					<Button asChild variant="outline" size="sm">
						<Link href="/app/tools/compare">
							<GitCompareArrowsIcon className="size-4 mr-1" />
							Compare Tools
						</Link>
					</Button>
				}
			/>
			<ToolsGrid />
		</div>
	);
}
