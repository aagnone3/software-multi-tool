"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { useAuthErrorMessages } from "@saas/auth/hooks/errors-messages";
import { useSession } from "@saas/auth/hooks/use-session";
import { useRouter } from "@shared/hooks/router";
import { Alert, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { PasswordInput } from "@ui/components/password-input";
import { AlertTriangleIcon, ArrowLeftIcon, MailboxIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
	password: z.string().min(8),
});

type FormValues = z.infer<typeof formSchema>;

export function ResetPasswordForm() {
	const { user } = useSession();
	const router = useRouter();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			password: "",
		},
	});

	const onSubmit = form.handleSubmit(async ({ password }) => {
		try {
			const { error } = await authClient.resetPassword({
				token: token ?? undefined,
				newPassword: password,
			});

			if (error) {
				throw error;
			}

			if (user) {
				router.push(config.auth.redirectAfterSignIn);
			}
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e
						? (e.code as string)
						: undefined,
				),
			});
		}
	});

	return (
		<>
			<h1 className="font-bold text-xl md:text-2xl">Reset password</h1>
			<p className="mt-1 mb-6 text-foreground/60">
				Enter your new password below.{" "}
			</p>

			{form.formState.isSubmitSuccessful ? (
				<Alert variant="success">
					<MailboxIcon />
					<AlertTitle>
						Your password has been updated successfully. You can now
						sign in with your new password.
					</AlertTitle>
				</Alert>
			) : (
				<Form {...form}>
					<form
						className="flex flex-col items-stretch gap-4"
						onSubmit={onSubmit}
					>
						{form.formState.errors.root && (
							<Alert variant="error">
								<AlertTriangleIcon />
								<AlertTitle>
									{form.formState.errors.root.message}
								</AlertTitle>
							</Alert>
						)}

						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>New password</FormLabel>
									<FormControl>
										<PasswordInput
											autoComplete="new-password"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button loading={form.formState.isSubmitting}>
							Reset password
						</Button>
					</form>
				</Form>
			)}

			<div className="mt-6 text-center text-sm">
				<Link href="/auth/login">
					<ArrowLeftIcon className="mr-1 inline size-4 align-middle" />
					Back to sign in
				</Link>
			</div>
		</>
	);
}
