"use client";
import { authClient } from "@repo/auth/client";
import { useRouter } from "@shared/hooks/router";
import { clearCache } from "@shared/lib/cache";
import { Progress } from "@ui/components/progress";
import { useSearchParams } from "next/navigation";
import React from "react";
import { withQuery } from "ufo";
import { OnboardingStep1 } from "./OnboardingStep1";
import { OnboardingStep2 } from "./OnboardingStep2";

export function OnboardingForm() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const stepSearchParam = searchParams.get("step");
	const redirectTo = searchParams.get("redirectTo");
	const onboardingStep = stepSearchParam
		? Number.parseInt(stepSearchParam, 10)
		: 1;

	const setStep = (step: number) => {
		router.replace(
			withQuery(
				window.location.pathname + (window.location.search ?? ""),
				{
					step,
				},
			),
		);
	};

	const onStep1Completed = () => {
		setStep(2);
	};

	const onCompleted = async () => {
		await authClient.updateUser({
			onboardingComplete: true,
		});

		await clearCache();
		router.replace(redirectTo ?? "/app");
	};

	const steps = [
		{
			component: <OnboardingStep1 onCompleted={onStep1Completed} />,
		},
		{
			component: <OnboardingStep2 onCompleted={onCompleted} />,
		},
	];

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">
				Let's get you started
			</h1>
			<p className="mt-2 mb-6 text-foreground/60">
				We need some information to set up your account.
			</p>

			{steps.length > 1 && (
				<div className="mb-6 flex items-center gap-3">
					<Progress
						value={(onboardingStep / steps.length) * 100}
						className="h-2"
					/>
					<span className="shrink-0 text-foreground/60 text-xs">
						{`Step ${onboardingStep} of ${steps.length}`}
					</span>
				</div>
			)}

			{steps[onboardingStep - 1].component}
		</div>
	);
}
