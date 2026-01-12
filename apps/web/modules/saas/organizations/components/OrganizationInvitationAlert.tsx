import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { MailCheckIcon } from "lucide-react";

export function OrganizationInvitationAlert({
	className,
}: {
	className?: string;
}) {
	return (
		<Alert variant="primary" className={className}>
			<MailCheckIcon />
			<AlertTitle>
				You have been invited to join an organization.
			</AlertTitle>
			<AlertDescription>
				You need to sign in or create an account to join the
				organization.
			</AlertDescription>
		</Alert>
	);
}
