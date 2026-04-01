import { ResetPasswordForm } from "@saas/auth/components/ResetPasswordForm";
import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return {
		title: "Reset your password",
	};
}

export default function ResetPasswordPage() {
	return <ResetPasswordForm />;
}
