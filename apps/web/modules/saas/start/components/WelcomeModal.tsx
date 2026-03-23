"use client";

import { useTools } from "@saas/tools/hooks/use-tools";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import {
	CoinsIcon,
	RocketIcon,
	SparklesIcon,
	WrenchIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const STORAGE_KEY = "welcome-modal-dismissed";

interface WelcomeStep {
	icon: React.ReactNode;
	title: string;
	description: string;
}

const STEPS: WelcomeStep[] = [
	{
		icon: <SparklesIcon className="size-8 text-primary" />,
		title: "Welcome to your AI workspace",
		description:
			"You're all set! This platform gives you access to a suite of AI-powered tools to supercharge your productivity.",
	},
	{
		icon: <WrenchIcon className="size-8 text-blue-500" />,
		title: "Explore the Tools",
		description:
			"Browse the Tools page to discover AI-powered utilities — from document analysis and meeting summarization to expense categorization and news analysis.",
	},
	{
		icon: <CoinsIcon className="size-8 text-amber-500" />,
		title: "Credits power your work",
		description:
			"Each tool run costs a small number of credits. Your plan includes credits every month. You can always buy more from the Billing page.",
	},
	{
		icon: <ZapIcon className="size-8 text-green-500" />,
		title: "Track your progress",
		description:
			"Your dashboard shows your activity streak, daily goals, and credit usage. The more you use the tools, the smarter your dashboard gets.",
	},
];

interface WelcomeModalProps {
	className?: string;
}

export function WelcomeModal({ className: _className }: WelcomeModalProps) {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState(0);
	const { enabledTools } = useTools();

	useEffect(() => {
		const dismissed = localStorage.getItem(STORAGE_KEY);
		if (!dismissed) {
			// Small delay so the dashboard loads first
			const timer = setTimeout(() => setOpen(true), 800);
			return () => clearTimeout(timer);
		}
	}, []);

	const handleClose = () => {
		localStorage.setItem(STORAGE_KEY, "true");
		setOpen(false);
	};

	const handleNext = () => {
		if (step < STEPS.length - 1) {
			setStep(step + 1);
		} else {
			handleClose();
		}
	};

	const handlePrev = () => {
		if (step > 0) {
			setStep(step - 1);
		}
	};

	const currentStep = STEPS[step];
	const isLast = step === STEPS.length - 1;
	const firstTool = enabledTools[0];

	return (
		<Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex justify-center mb-4">
						{currentStep.icon}
					</div>
					<DialogTitle className="text-center text-xl">
						{currentStep.title}
					</DialogTitle>
					<DialogDescription className="text-center text-base leading-relaxed">
						{currentStep.description}
					</DialogDescription>
				</DialogHeader>

				{/* Step dots */}
				<div className="flex justify-center gap-2 py-2">
					{STEPS.map((_, i) => (
						<button
							key={i}
							type="button"
							onClick={() => setStep(i)}
							aria-label={`Go to step ${i + 1}`}
							className={`size-2 rounded-full transition-all ${
								i === step
									? "bg-primary w-6"
									: "bg-muted-foreground/30 hover:bg-muted-foreground/50"
							}`}
						/>
					))}
				</div>

				<DialogFooter className="flex-col sm:flex-row gap-2">
					<div className="flex items-center justify-between w-full gap-2">
						<Button
							variant="ghost"
							onClick={handlePrev}
							disabled={step === 0}
							className="mr-auto"
						>
							Back
						</Button>
						<Button variant="ghost" onClick={handleClose} size="sm">
							Skip tour
						</Button>
						{isLast ? (
							<Button asChild onClick={handleClose}>
								<Link
									href={
										firstTool
											? `/app/tools/${firstTool.slug}`
											: "/app/tools"
									}
								>
									<RocketIcon className="size-4 mr-1" />
									Try a tool
								</Link>
							</Button>
						) : (
							<Button onClick={handleNext}>Next</Button>
						)}
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
