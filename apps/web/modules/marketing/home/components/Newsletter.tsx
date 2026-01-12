"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { CheckCircleIcon, KeyIcon } from "lucide-react";

import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
	email: z.string().email(),
});
type FormValues = z.infer<typeof formSchema>;

export function Newsletter() {
	const newsletterSignupMutation = useMutation(
		orpc.newsletter.subscribe.mutationOptions(),
	);

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
	});

	const onSubmit = form.handleSubmit(async ({ email }) => {
		try {
			await newsletterSignupMutation.mutateAsync({ email });
		} catch {
			form.setError("email", {
				message:
					"Could not subscribe to newsletter. Please try again later.",
			});
		}
	});

	return (
		<section className="py-16">
			<div className="container">
				<div className="mb-8 text-center">
					<KeyIcon className="mx-auto mb-3 size-8 text-primary" />
					<h1 className="font-bold text-3xl lg:text-4xl">
						Get early access
					</h1>
					<p className="mt-3 text-lg opacity-70">
						Be among the first to get access to Software Multitool.
					</p>
				</div>

				<div className="mx-auto max-w-lg">
					{form.formState.isSubmitSuccessful ? (
						<Alert variant="success">
							<CheckCircleIcon />
							<AlertTitle>Subscribed</AlertTitle>
							<AlertDescription>
								Thank you for subscribing to our newsletter. We
								will keep you posted.
							</AlertDescription>
						</Alert>
					) : (
						<form onSubmit={onSubmit}>
							<div className="flex items-start">
								<Input
									type="email"
									required
									placeholder="Email"
									{...form.register("email")}
								/>

								<Button
									type="submit"
									className="ml-4"
									loading={form.formState.isSubmitting}
								>
									Subscribe
								</Button>
							</div>
							{form.formState.errors.email && (
								<p className="mt-1 text-destructive text-xs">
									{form.formState.errors.email.message}
								</p>
							)}
						</form>
					)}
				</div>
			</div>
		</section>
	);
}
