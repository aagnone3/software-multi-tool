import {
	BotIcon,
	FileTextIcon,
	HeadphonesIcon,
	type LucideIcon,
	ZapIcon,
} from "lucide-react";

interface Feature {
	id: string;
	title: string;
	description: string;
	icon: LucideIcon;
}

const features: Feature[] = [
	{
		id: "document-summarization",
		title: "Document Summarization",
		description:
			"Upload contracts, reports, or articles and get clear, actionable summaries in seconds. Save hours of reading time and focus on what matters.",
		icon: FileTextIcon,
	},
	{
		id: "audio-processing",
		title: "Audio Processing",
		description:
			"Transform meetings, interviews, and voice notes into searchable text. Extract insights from audio content without manual transcription.",
		icon: HeadphonesIcon,
	},
	{
		id: "productivity-enhancement",
		title: "Productivity Enhancement",
		description:
			"Automate repetitive tasks, generate professional emails, and streamline your daily workflow. Work smarter, not harder.",
		icon: ZapIcon,
	},
	{
		id: "general-automation",
		title: "General Automation",
		description:
			"Connect your business processes with AI-powered automation. From data entry to customer follow-ups, let AI handle the routine.",
		icon: BotIcon,
	},
];

export function Features() {
	return (
		<section
			id="features"
			className="scroll-my-20 bg-muted/30 py-16 lg:py-24"
		>
			<div className="container max-w-6xl">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="font-bold text-3xl md:text-4xl lg:text-5xl">
						Powerful tools, simple to use
					</h2>
					<p className="mt-4 text-balance text-foreground/70 text-lg">
						Everything you need to leverage AI in your business — no
						technical expertise required.
					</p>
				</div>

				<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:gap-8">
					{features.map((feature) => (
						<div
							key={feature.id}
							className="group rounded-2xl border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg lg:p-8"
						>
							<div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
								<feature.icon className="size-6" />
							</div>
							<h3 className="font-semibold text-xl">
								{feature.title}
							</h3>
							<p className="mt-2 text-foreground/70 leading-relaxed">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
