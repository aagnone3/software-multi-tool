"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
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
	ArrowRightIcon,
	CoinsIcon,
	CreditCardIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { useCreditsBalance } from "../hooks/use-credits-balance";

interface NoCreditsModalProps {
	open: boolean;
	onClose: () => void;
	/** Credit cost of the action that was attempted */
	creditCost?: number;
	/** Name of the tool that was attempted */
	toolName?: string;
}

export function NoCreditsModal({
	open,
	onClose,
	creditCost,
	toolName,
}: NoCreditsModalProps) {
	const { activeOrganization } = useActiveOrganization();
	const { isStarterPlan, isFreePlan } = useCreditsBalance();

	const billingPath = activeOrganization
		? `/app/${activeOrganization.slug}/settings/billing`
		: "/app/settings/billing";

	const upgradeProPath = `${billingPath}?upgrade=pro`;

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="flex justify-center mb-4">
						<div className="rounded-full bg-amber-100 p-4">
							<CoinsIcon className="size-8 text-amber-600" />
						</div>
					</div>
					<DialogTitle className="text-center">
						Out of credits
					</DialogTitle>
					<DialogDescription className="text-center">
						{toolName && creditCost ? (
							<>
								Running <strong>{toolName}</strong> requires{" "}
								<strong>{creditCost} credits</strong>, but you
								don&apos;t have enough to proceed.
							</>
						) : (
							<>
								You&apos;ve used all your credits for this
								billing period. Add more to continue.
							</>
						)}
					</DialogDescription>
				</DialogHeader>

				{isStarterPlan ? (
					<div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
						<div className="flex items-center gap-2 text-sm font-medium">
							<ZapIcon className="size-4 text-primary" />
							Upgrade to Pro for 5× more credits
						</div>
						<ul className="text-xs text-muted-foreground space-y-1 ml-6">
							<li>500 credits/month (vs 100 on Starter)</li>
							<li>Scheduled runs &amp; bulk actions</li>
							<li>Priority processing</li>
						</ul>
					</div>
				) : (
					<div className="grid grid-cols-2 gap-3 py-2">
						<div className="rounded-lg border bg-muted/50 p-3 text-center">
							<CoinsIcon className="size-5 mx-auto mb-1 text-amber-500" />
							<div className="text-xs font-medium">
								Buy credits
							</div>
							<div className="text-xs text-muted-foreground">
								One-time purchase
							</div>
						</div>
						<div className="rounded-lg border bg-muted/50 p-3 text-center">
							<ZapIcon className="size-5 mx-auto mb-1 text-primary" />
							<div className="text-xs font-medium">
								Upgrade plan
							</div>
							<div className="text-xs text-muted-foreground">
								More monthly credits
							</div>
						</div>
					</div>
				)}

				<DialogFooter className="flex-col sm:flex-row gap-2">
					<Button
						variant="ghost"
						onClick={onClose}
						className="sm:mr-auto"
					>
						Maybe later
					</Button>
					{isStarterPlan ? (
						<>
							<Button asChild variant="outline">
								<Link
									href="/pricing#pricing-plan-pro"
									onClick={onClose}
								>
									Compare plans
								</Link>
							</Button>
							<Button asChild variant="primary">
								<Link href={upgradeProPath} onClick={onClose}>
									<ZapIcon className="size-4 mr-1" />
									Upgrade to Pro
									<ArrowRightIcon className="size-3 ml-1" />
								</Link>
							</Button>
						</>
					) : (
						<>
							{isFreePlan && (
								<Button asChild variant="outline">
									<Link href={billingPath} onClick={onClose}>
										<CoinsIcon className="size-4 mr-1" />
										Buy Credits
									</Link>
								</Button>
							)}
							<Button asChild>
								<Link href={billingPath} onClick={onClose}>
									<CreditCardIcon className="size-4 mr-1" />
									Upgrade Plan
								</Link>
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
