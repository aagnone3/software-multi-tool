"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { usePurchases } from "@saas/payments/hooks/purchases";
import { AlertTriangleIcon, CreditCardIcon } from "lucide-react";
import React from "react";
import { CustomerPortalButton } from "../../settings/components/CustomerPortalButton";

const ISSUE_META: Record<
	string,
	{ headline: string; detail: string; urgent: boolean }
> = {
	past_due: {
		headline: "Your payment is past due",
		detail: "We couldn't collect your last payment. Update your payment method to keep your plan active and avoid losing access.",
		urgent: true,
	},
	unpaid: {
		headline: "Payment failed — action required",
		detail: "Your subscription is unpaid. Please update your billing details now to restore full access.",
		urgent: true,
	},
	incomplete: {
		headline: "Your subscription is incomplete",
		detail: "Your payment couldn't be confirmed. Complete your payment to activate your plan.",
		urgent: true,
	},
	paused: {
		headline: "Your subscription is paused",
		detail: "Your plan is currently paused. Resume your subscription to regain access to all features.",
		urgent: false,
	},
};

interface PaymentIssueAlertProps {
	organizationId?: string;
	className?: string;
}

export function PaymentIssueAlert({
	organizationId,
	className,
}: PaymentIssueAlertProps) {
	const { activePlan } = usePurchases(organizationId);
	const { track } = useProductAnalytics();

	if (!activePlan?.status || !ISSUE_META[activePlan.status]) {
		return null;
	}

	const { headline, detail, urgent } = ISSUE_META[activePlan.status];
	const purchaseId =
		"purchaseId" in activePlan ? activePlan.purchaseId : undefined;

	return (
		<div
			className={`rounded-lg border ${
				urgent
					? "border-destructive/30 bg-destructive/5"
					: "border-warning/30 bg-warning/5"
			} p-4 ${className ?? ""}`}
			role="alert"
			data-testid="payment-issue-alert"
			data-status={activePlan.status}
		>
			<div className="flex items-start gap-3">
				<AlertTriangleIcon
					className={`mt-0.5 size-5 shrink-0 ${urgent ? "text-destructive" : "text-warning"}`}
					aria-hidden="true"
				/>
				<div className="flex-1">
					<p
						className={`font-semibold text-sm ${urgent ? "text-destructive" : "text-warning"}`}
					>
						{headline}
					</p>
					<p className="mt-0.5 text-muted-foreground text-sm">
						{detail}
					</p>
					{purchaseId && (
						<div className="mt-3">
							<CustomerPortalButton purchaseId={purchaseId} />
						</div>
					)}
					{!purchaseId && (
						<a
							href="/app/settings/billing"
							className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-2"
							onClick={() =>
								track({
									name: "payment_issue_alert_cta_clicked",
									props: {
										status: activePlan.status ?? "",
										source: "payment_issue_alert",
									},
								})
							}
						>
							<CreditCardIcon className="size-3.5" />
							Go to billing settings
						</a>
					)}
				</div>
			</div>
		</div>
	);
}
