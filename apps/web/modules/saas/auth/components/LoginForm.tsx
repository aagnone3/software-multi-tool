"use client";

import { useIsFeatureEnabled } from "@analytics";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { config } from "@repo/config";
import { useAuthErrorMessages } from "@saas/auth/hooks/errors-messages";
import { sessionQueryKey } from "@saas/auth/lib/api";
import { OrganizationInvitationAlert } from "@saas/organizations/components/OrganizationInvitationAlert";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
} from "@ui/components/form";
import { Input } from "@ui/components/input";
import {
	AlertTriangleIcon,
	ArrowRightIcon,
	EyeIcon,
	EyeOffIcon,
	KeyIcon,
	MailboxIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";
import {
	type OAuthProvider,
	oAuthProviders,
} from "../constants/oauth-providers";
import { useSession } from "../hooks/use-session";
import { isDevEnvironment } from "../lib/is-dev-environment";
import { LoginModeSwitch } from "./LoginModeSwitch";
import { SocialSigninButton } from "./SocialSigninButton";

const formSchema = z.union([
	z.object({
		mode: z.literal("magic-link"),
		email: z.string().email(),
	}),
	z.object({
		mode: z.literal("password"),
		email: z.string().email(),
		password: z.string().min(1),
	}),
]);

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();

	const [showPassword, setShowPassword] = useState(false);
	const invitationId = searchParams.get("invitationId");
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: email ?? "",
			password: "",
			mode: config.auth.enablePasswordLogin ? "password" : "magic-link",
		},
	});

	const redirectPath = invitationId
		? `/organization-invitation/${invitationId}`
		: (redirectTo ?? config.auth.redirectAfterSignIn);

	useEffect(() => {
		if (sessionLoaded && user) {
			router.replace(redirectPath);
		}
	}, [user, sessionLoaded]);

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		try {
			if (values.mode === "password") {
				const { data, error } = await authClient.signIn.email({
					...values,
				});

				if (error) {
					throw error;
				}

				if ((data as any).twoFactorRedirect) {
					router.replace(
						withQuery(
							"/auth/verify",
							Object.fromEntries(searchParams.entries()),
						),
					);
					return;
				}

				queryClient.invalidateQueries({
					queryKey: sessionQueryKey,
				});

				router.replace(redirectPath);
			} else {
				const { error } = await authClient.signIn.magicLink({
					...values,
					callbackURL: redirectPath,
				});

				if (error) {
					throw error;
				}
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
	};

	const signInWithPasskey = async () => {
		try {
			await authClient.signIn.passkey();

			router.replace(redirectPath);
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e
						? (e.code as string)
						: undefined,
				),
			});
		}
	};

	const signinMode = form.watch("mode");

	// Feature flags for authentication methods
	const isGithubLoginEnabled = useIsFeatureEnabled("enable-github-login");
	const isPasskeyLoginEnabled = useIsFeatureEnabled("enable-passkey-login");

	// Filter OAuth providers based on feature flags
	const filteredOAuthProviders = Object.keys(oAuthProviders).filter(
		(providerId) => {
			if (providerId === "github" && !isGithubLoginEnabled) {
				return false;
			}
			return true;
		},
	);

	// Quick login for non-production environments
	const isNonProduction = isDevEnvironment();
	const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);

	const handleQuickLogin = async () => {
		setIsQuickLoggingIn(true);
		try {
			const { data, error } = await authClient.signIn.email({
				email: "test@preview.local",
				password: "TestPassword123",
			});

			if (error) {
				throw error;
			}

			if ((data as any).twoFactorRedirect) {
				router.replace(
					withQuery(
						"/auth/verify",
						Object.fromEntries(searchParams.entries()),
					),
				);
				return;
			}

			queryClient.invalidateQueries({
				queryKey: sessionQueryKey,
			});

			router.replace(redirectPath);
		} catch (e) {
			const errorCode =
				e && typeof e === "object" && "code" in e
					? (e.code as string)
					: undefined;

			// Check if error indicates test user doesn't exist
			const isUserNotFoundError =
				errorCode === "INVALID_EMAIL_OR_PASSWORD" ||
				errorCode === "USER_NOT_FOUND" ||
				errorCode === "CREDENTIAL_ACCOUNT_NOT_FOUND";

			if (isUserNotFoundError) {
				form.setError("root", {
					message:
						"Test user not found. Seed your database using: PGPASSWORD=postgres psql -h localhost -U postgres -d local_aimultitool -f supabase/seed.sql",
				});
			} else {
				form.setError("root", {
					message: getAuthErrorMessage(errorCode),
				});
			}
		} finally {
			setIsQuickLoggingIn(false);
		}
	};

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">
				Sign in to your account
			</h1>
			<p className="mt-1 mb-6 text-foreground/60">
				Enter your credentials to sign in
			</p>

			{form.formState.isSubmitSuccessful &&
			signinMode === "magic-link" ? (
				<Alert variant="success">
					<MailboxIcon />
					<AlertTitle>Check your inbox!</AlertTitle>
					<AlertDescription>
						We have sent an email with a magic sign-in link. The
						link will expire in 24 hours.
					</AlertDescription>
				</Alert>
			) : (
				<>
					{invitationId && (
						<OrganizationInvitationAlert className="mb-6" />
					)}

					<Form {...form}>
						<form
							className="space-y-4"
							onSubmit={form.handleSubmit(onSubmit)}
						>
							{config.auth.enableMagicLink &&
								config.auth.enablePasswordLogin && (
									<LoginModeSwitch
										activeMode={signinMode}
										onChange={(mode) =>
											form.setValue(
												"mode",
												mode as typeof signinMode,
											)
										}
									/>
								)}

							{form.formState.isSubmitted &&
								form.formState.errors.root?.message && (
									<Alert variant="error">
										<AlertTriangleIcon />
										<AlertTitle>
											{form.formState.errors.root.message}
										</AlertTitle>
									</Alert>
								)}

							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												{...field}
												autoComplete="email"
											/>
										</FormControl>
									</FormItem>
								)}
							/>

							{config.auth.enablePasswordLogin &&
								signinMode === "password" && (
									<FormField
										control={form.control}
										name="password"
										render={({ field }) => (
											<FormItem>
												<div className="flex justify-between gap-4">
													<FormLabel>
														Password
													</FormLabel>

													<Link
														href="/auth/forgot-password"
														className="text-foreground/60 text-xs"
													>
														Forgot password?
													</Link>
												</div>
												<FormControl>
													<div className="relative">
														<Input
															type={
																showPassword
																	? "text"
																	: "password"
															}
															className="pr-10"
															{...field}
															autoComplete="current-password"
														/>
														<button
															type="button"
															onClick={() =>
																setShowPassword(
																	!showPassword,
																)
															}
															className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary text-xl"
														>
															{showPassword ? (
																<EyeOffIcon className="size-4" />
															) : (
																<EyeIcon className="size-4" />
															)}
														</button>
													</div>
												</FormControl>
											</FormItem>
										)}
									/>
								)}

							<Button
								className="w-full"
								type="submit"
								variant="secondary"
								loading={form.formState.isSubmitting}
							>
								{signinMode === "magic-link"
									? "Send magic link"
									: "Sign in"}
							</Button>
						</form>
					</Form>

					{((config.auth.enablePasskeys && isPasskeyLoginEnabled) ||
						(config.auth.enableSignup &&
							config.auth.enableSocialLogin &&
							filteredOAuthProviders.length > 0)) && (
						<>
							<div className="relative my-6 h-4">
								<hr className="relative top-2" />
								<p className="-translate-x-1/2 absolute top-0 left-1/2 mx-auto inline-block h-4 bg-card px-2 text-center font-medium text-foreground/60 text-sm leading-tight">
									or continue with
								</p>
							</div>

							<div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2">
								{config.auth.enableSignup &&
									config.auth.enableSocialLogin &&
									filteredOAuthProviders.map((providerId) => (
										<SocialSigninButton
											key={providerId}
											provider={
												providerId as OAuthProvider
											}
										/>
									))}

								{config.auth.enablePasskeys &&
									isPasskeyLoginEnabled && (
										<Button
											variant="light"
											className="w-full sm:col-span-2"
											onClick={() => signInWithPasskey()}
										>
											<KeyIcon className="mr-1.5 size-4 text-primary" />
											Sign in with passkey
										</Button>
									)}
							</div>
						</>
					)}

					{config.auth.enableSignup && (
						<div className="mt-6 text-center text-sm">
							<span className="text-foreground/60">
								Don't have an account yet?{" "}
							</span>
							<Link
								href={withQuery(
									"/auth/signup",
									Object.fromEntries(searchParams.entries()),
								)}
							>
								Create an account
								<ArrowRightIcon className="ml-1 inline size-4 align-middle" />
							</Link>
						</div>
					)}

					{isNonProduction && (
						<div className="mt-6 border-t pt-4">
							<Button
								type="button"
								variant="outline"
								className="w-full border-dashed border-amber-500/50 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-400/50 dark:text-amber-400 dark:hover:bg-amber-950 dark:hover:text-amber-300"
								onClick={() => handleQuickLogin()}
								loading={isQuickLoggingIn}
								disabled={form.formState.isSubmitting}
							>
								<ZapIcon className="mr-1.5 size-4" />
								Quick Login as Test User
							</Button>
							<p className="mt-2 text-center text-muted-foreground text-xs">
								Dev/Preview only - uses test@preview.local
							</p>
						</div>
					)}
				</>
			)}
		</div>
	);
}
