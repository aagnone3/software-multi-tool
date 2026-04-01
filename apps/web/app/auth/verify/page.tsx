import { OtpForm } from "@saas/auth/components/OtpForm";
import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return {
		title: "Verify your account",
	};
}

export default function VerifyPage() {
	return <OtpForm />;
}
