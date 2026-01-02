import { ORPCError } from "@orpc/client";
import { getOrganizationBySlug } from "@repo/database";
import slugify from "@sindresorhus/slugify";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";

// Use alphanumeric characters only for slug suffix
const nanoid = customAlphabet(
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
	5,
);

export const generateOrganizationSlug = publicProcedure
	.route({
		method: "GET",
		path: "/organizations/generate-slug",
		tags: ["Organizations"],
		summary: "Generate organization slug",
		description: "Generate a unique slug from an organization name",
	})
	.input(
		z.object({
			name: z.string(),
		}),
	)
	.handler(async ({ input: { name } }) => {
		const baseSlug = slugify(name, {
			lowercase: true,
		});

		let slug = baseSlug;
		let hasAvailableSlug = false;

		for (let i = 0; i < 3; i++) {
			const existing = await getOrganizationBySlug(slug);

			if (!existing) {
				hasAvailableSlug = true;
				break;
			}

			slug = `${baseSlug}-${nanoid()}`;
		}

		if (!hasAvailableSlug) {
			throw new ORPCError("INTERNAL_SERVER_ERROR");
		}

		return { slug };
	});
