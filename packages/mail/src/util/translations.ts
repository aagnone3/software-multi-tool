/** Default locale (English only after i18n removal) */
export const defaultLocale = "en";

/** Mail translations - English only */
export const defaultTranslations = {
	mail: {
		common: {
			openLinkInBrowser:
				"If you want to open the link in a different browser than your default one, copy and paste this link:",
			otp: "One-time password",
			useLink: "or use the following link:",
		},
		emailVerification: {
			body: "Hey,\nplease click the link below to verify this new email address.",
			confirmEmail: "Verify email",
			subject: "Verify your email",
		},
		forgotPassword: {
			body: "Hey,\nyou requested a password reset.\n\nClick the button below to reset your password.",
			resetPassword: "Reset password",
			subject: "Reset your password",
		},
		magicLink: {
			body: "Hey,\nyou requested a login email from Software Multitool.\n\nClick the link below to login.",
			login: "Login",
			subject: "Login to Software Multitool",
		},
		newUser: {
			body: "Hey,\nthanks for signing up for Software Multitool.\n\nTo start using our app, please confirm your email address by clicking the link below.",
			confirmEmail: "Confirm email",
			subject: "Confirm your email",
		},
		newsletterSignup: {
			body: "Thank you for signing up for the Software Multitool newsletter. We will keep you updated with the latest news and updates.",
			subject: "Welcome to the Software Multitool Newsletter!",
		},
		notificationEmail: {
			subject: "Notification from Software Multitool",
		},
		organizationInvitation: {
			body: "You have been invited to join the organization {organizationName}. Click the button below or copy and paste the link into your browser of choice to accept the invitation and join the organization.",
			headline: "Join the organization {organizationName}",
			join: "Join the organization",
			subject: "You have been invited to join an organization",
		},
	},
} as const;

/** Type for mail translations structure */
export type MailTranslations = typeof defaultTranslations;
