import { ForgotPasswordForm } from "@saas/auth/components/ForgotPasswordForm";
import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return {
		title: "Forgot your password?",
	};
}

export default function ForgotPasswordPage() {
	return <ForgotPasswordForm />;
}
