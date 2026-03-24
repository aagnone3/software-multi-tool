"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { MailIcon } from "lucide-react";
import React, { useState } from "react";

export function BlogNewsletterCta() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<
		"idle" | "submitting" | "done" | "error"
	>("idle");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!email) return;
		setStatus("submitting");
		try {
			const res = await fetch("/api/newsletter", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			if (res.ok) {
				setStatus("done");
			} else {
				setStatus("error");
			}
		} catch {
			setStatus("error");
		}
	}

	return (
		<div className="my-10 rounded-xl border border-primary/20 bg-primary/5 p-6">
			<div className="flex items-center gap-2 mb-2">
				<MailIcon className="size-5 text-primary" />
				<h3 className="font-semibold text-base">Get weekly AI tips</h3>
			</div>
			<p className="text-sm text-foreground/60 mb-4">
				Join 500+ small business owners getting practical AI
				productivity tips every week. No fluff.
			</p>
			{status === "done" ? (
				<p className="text-sm font-medium text-primary">
					✓ You&apos;re in! Check your inbox to confirm.
				</p>
			) : (
				<form onSubmit={handleSubmit} className="flex gap-2">
					<Input
						type="email"
						placeholder="your@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						className="flex-1 text-sm"
						disabled={status === "submitting"}
					/>
					<Button
						type="submit"
						size="sm"
						disabled={status === "submitting"}
					>
						{status === "submitting" ? "..." : "Subscribe"}
					</Button>
				</form>
			)}
			{status === "error" && (
				<p className="mt-2 text-xs text-destructive">
					Something went wrong. Please try again.
				</p>
			)}
		</div>
	);
}
