import { PageHeader } from "@saas/shared/components/PageHeader";
import { ToolsGrid } from "@saas/tools/components/ToolsGrid";

export default function ToolsPage() {
	return (
		<div>
			<PageHeader
				title="Tools"
				subtitle="Explore our collection of AI-powered utilities"
			/>
			<ToolsGrid />
		</div>
	);
}
