import { SessionProvider } from "@saas/auth/components/SessionProvider";
import { AuthWrapper } from "@saas/shared/components/AuthWrapper";
import { Document } from "@shared/components/Document";
import type { PropsWithChildren } from "react";

export default async function AuthLayout({ children }: PropsWithChildren) {
	return (
		<Document>
			<SessionProvider>
				<AuthWrapper>{children}</AuthWrapper>
			</SessionProvider>
		</Document>
	);
}
