import { PostUpgradeWelcome } from "@saas/payments/components/PostUpgradeWelcome";
import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
	title: "Welcome to Pro",
};

export default function PostUpgradeWelcomePage() {
	return <PostUpgradeWelcome />;
}
