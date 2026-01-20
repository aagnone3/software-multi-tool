import {
	CreditCardIcon,
	LayoutDashboardIcon,
	MessageSquareIcon,
	UserPlusIcon,
} from "lucide-react";

interface Step {
	number: number;
	title: string;
	description: string;
	icon: typeof UserPlusIcon;
}

const steps: Step[] = [
	{
		number: 1,
		title: "Sign up for free",
		description:
			"Create your account in seconds. No credit card required, no complicated setup — just enter your email and get started.",
		icon: UserPlusIcon,
	},
	{
		number: 2,
		title: "Explore the tools",
		description:
			"Browse our dashboard of AI-powered tools designed for small businesses. Each tool is ready to use with clear instructions.",
		icon: LayoutDashboardIcon,
	},
	{
		number: 3,
		title: "Chat with AI",
		description:
			"Not sure which tool fits your needs? Our AI assistant helps you find the right solution for your specific problem.",
		icon: MessageSquareIcon,
	},
	{
		number: 4,
		title: "Scale as you grow",
		description:
			"Start with free credits and add more as your usage grows. Only pay for what you need, when you need it.",
		icon: CreditCardIcon,
	},
];

export function HowItWorks() {
	return (
		<section id="how-it-works" className="scroll-mt-16 py-16 lg:py-24">
			<div className="container max-w-6xl">
				<div className="mx-auto max-w-3xl text-center">
					<h2 className="font-bold text-3xl md:text-4xl lg:text-5xl">
						How it works
					</h2>
					<p className="mt-4 text-balance text-foreground/70 text-lg">
						Getting started is easy. Here&apos;s your path from
						sign-up to productivity.
					</p>
				</div>

				<div className="relative mt-12 lg:mt-16">
					{/* Connection line for desktop */}
					<div className="absolute top-[60px] right-0 left-0 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent lg:block" />

					<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
						{steps.map((step) => (
							<div
								key={step.number}
								className="relative text-center"
							>
								{/* Step number circle */}
								<div className="relative mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:size-20">
									<step.icon className="size-7 lg:size-8" />
									<span className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-highlight font-bold text-highlight-foreground text-sm shadow">
										{step.number}
									</span>
								</div>

								<h3 className="font-semibold text-lg lg:text-xl">
									{step.title}
								</h3>
								<p className="mt-2 text-foreground/70 text-sm leading-relaxed lg:text-base">
									{step.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
