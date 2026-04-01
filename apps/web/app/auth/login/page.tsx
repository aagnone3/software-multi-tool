import { LoginForm } from "@saas/auth/components/LoginForm";
import React from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	return {
		title: "Welcome back",
	};
}

export default function LoginPage() {
	return <LoginForm />;
}
