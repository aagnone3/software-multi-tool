"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { CreditCardIcon } from "lucide-react";
import { toast } from "sonner";

export function CustomerPortalButton({ purchaseId }: { purchaseId: string }) {
	const createCustomerPortalMutation = useMutation(
		orpc.payments.createCustomerPortalLink.mutationOptions(),
	);

	const createCustomerPortal = async () => {
		try {
			const { customerPortalLink } =
				await createCustomerPortalMutation.mutateAsync({
					purchaseId,
					redirectUrl: window.location.href,
				});

			window.location.href = customerPortalLink;
		} catch {
			toast.error(
				"Could not create a customer portal session. Please try again.",
			);
		}
	};

	return (
		<Button
			variant="light"
			size="sm"
			onClick={() => createCustomerPortal()}
			loading={createCustomerPortalMutation.isPending}
		>
			<CreditCardIcon className="mr-2 size-4" />
			Manage billing
		</Button>
	);
}
