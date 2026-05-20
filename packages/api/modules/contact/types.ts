import { z } from "zod";

export const contactFormSchema = z.object({
	email: z.string().email(),
	name: z.string().min(3),
	message: z.string().min(10),
	turnstileToken: z.string().optional(),
	hutk: z.string().optional(),
	pageUri: z.string().url().optional(),
	pageName: z.string().max(200).optional(),
	website: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
