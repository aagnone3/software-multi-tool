"use client";

import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Input } from "@ui/components/input";
import { cn } from "@ui/lib";
import { CheckIcon, CopyIcon, GiftIcon, UsersIcon } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const REFERRAL_CREDITS_REWARD = 10; // credits given per successful referral

interface ReferralWidgetProps {
	className?: string;
}

function buildReferralLink(userId: string, orgSlug?: string): string {
	const base =
		typeof window !== "undefined"
			? window.location.origin
			: "https://app.example.com";
	const ref = orgSlug ? `${userId}-${orgSlug}` : userId;
	return `${base}/?ref=${encodeURIComponent(ref)}`;
}

export function ReferralWidget({ className }: ReferralWidgetProps) {
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const [copied, setCopied] = useState(false);
	const [referralLink, setReferralLink] = useState("");

	useEffect(() => {
		if (user?.id) {
			setReferralLink(
				buildReferralLink(user.id, activeOrganization?.slug),
			);
		}
	}, [user?.id, activeOrganization?.slug]);

	const handleCopy = useCallback(() => {
		if (!referralLink) {
			return;
		}
		navigator.clipboard
			.writeText(referralLink)
			.then(() => {
				setCopied(true);
				toast.success("Referral link copied!", {
					description: "Share it with friends to earn free credits.",
				});
				setTimeout(() => setCopied(false), 2000);
			})
			.catch(() => {
				toast.error("Failed to copy link");
			});
	}, [referralLink]);

	if (!user) {
		return null;
	}

	return (
		<Card className={cn(className)}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<GiftIcon className="h-4 w-4 text-primary" />
					Refer friends, earn free credits
				</CardTitle>
				<CardDescription>
					Share your referral link. You get{" "}
					<strong>{REFERRAL_CREDITS_REWARD} free credits</strong> for
					every friend who signs up and runs their first job.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* How it works */}
				<div className="grid grid-cols-3 gap-3 text-center text-xs">
					<div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
						<UsersIcon className="h-5 w-5 text-primary" />
						<span className="font-medium">Share your link</span>
						<span className="text-muted-foreground">
							Send it to a friend
						</span>
					</div>
					<div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
						<GiftIcon className="h-5 w-5 text-primary" />
						<span className="font-medium">They sign up</span>
						<span className="text-muted-foreground">
							Free account, no card
						</span>
					</div>
					<div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
						<CheckIcon className="h-5 w-5 text-green-500" />
						<span className="font-medium">
							You earn {REFERRAL_CREDITS_REWARD} credits
						</span>
						<span className="text-muted-foreground">
							After their first job
						</span>
					</div>
				</div>

				{/* Referral link */}
				<div className="flex gap-2">
					<Input
						readOnly
						value={referralLink}
						className="font-mono text-xs"
						aria-label="Referral link"
						onClick={(e) => (e.target as HTMLInputElement).select()}
					/>
					<Button
						variant="outline"
						size="icon"
						onClick={handleCopy}
						aria-label="Copy referral link"
						className="shrink-0"
					>
						{copied ? (
							<CheckIcon className="h-4 w-4 text-green-500" />
						) : (
							<CopyIcon className="h-4 w-4" />
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
