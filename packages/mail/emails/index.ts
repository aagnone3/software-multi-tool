import { EmailVerification } from "../emails/EmailVerification";
import { ForgotPassword } from "../emails/ForgotPassword";
import { MagicLink } from "../emails/MagicLink";
import { NewsletterSignup } from "../emails/NewsletterSignup";
import { NewUser } from "../emails/NewUser";
import { NotificationEmail } from "../emails/NotificationEmail";
import { OrganizationInvitation } from "../emails/OrganizationInvitation";
import { WelcomeEmail } from "../emails/WelcomeEmail";

export const mailTemplates = {
	magicLink: MagicLink,
	forgotPassword: ForgotPassword,
	newUser: NewUser,
	newsletterSignup: NewsletterSignup,
	notificationEmail: NotificationEmail,
	organizationInvitation: OrganizationInvitation,
	emailVerification: EmailVerification,
	welcomeEmail: WelcomeEmail,
} as const;
