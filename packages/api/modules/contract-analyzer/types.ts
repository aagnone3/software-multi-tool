import { z } from "zod";

/**
 * File data schema for uploaded contract documents.
 * Contains base64-encoded file content and metadata.
 */
export const ContractFileDataSchema = z.object({
	/** Base64-encoded file content */
	content: z.string().min(1, "File content is required"),
	/** MIME type of the file */
	mimeType: z.string().min(1, "MIME type is required"),
	/** Original filename */
	filename: z.string().min(1, "Filename is required"),
});

export type ContractFileData = z.infer<typeof ContractFileDataSchema>;

/**
 * Contract Analyzer input schema.
 * Accepts either direct text or a file upload (PDF, DOCX, or TXT).
 */
export const ContractAnalyzerInputSchema = z
	.object({
		/** Direct contract text input (mutually exclusive with fileData) */
		contractText: z.string().optional(),
		/** Uploaded file data (mutually exclusive with contractText) */
		fileData: ContractFileDataSchema.optional(),
		/** Analysis depth level */
		analysisDepth: z
			.enum(["summary", "standard", "detailed"])
			.optional()
			.default("standard"),
	})
	.refine(
		(data) => {
			// Either contractText or fileData must be provided, but not both
			const hasText =
				data.contractText && data.contractText.trim().length > 0;
			const hasFile = data.fileData !== undefined;
			return hasText || hasFile;
		},
		{
			message: "Either contract text or a file upload is required",
			path: ["contractText"],
		},
	);

export type ContractAnalyzerInput = z.infer<typeof ContractAnalyzerInputSchema>;

export const RiskItemSchema = z.object({
	category: z.string(),
	description: z.string(),
	severity: z.enum(["low", "medium", "high", "critical"]),
	clause: z.string().nullable(),
	recommendation: z.string(),
});

export type RiskItem = z.infer<typeof RiskItemSchema>;

export const ObligationSchema = z.object({
	party: z.string(),
	description: z.string(),
	deadline: z.string().nullable(),
	isRecurring: z.boolean(),
	frequency: z.string().nullable(),
});

export type Obligation = z.infer<typeof ObligationSchema>;

export const KeyTermSchema = z.object({
	term: z.string(),
	definition: z.string(),
	section: z.string().nullable(),
});

export type KeyTerm = z.infer<typeof KeyTermSchema>;

export const ContractAnalyzerOutputSchema = z.object({
	summary: z.object({
		contractType: z.string(),
		parties: z.array(
			z.object({
				name: z.string(),
				role: z.string(),
			}),
		),
		effectiveDate: z.string().nullable(),
		expirationDate: z.string().nullable(),
		governingLaw: z.string().nullable(),
		overview: z.string(),
	}),
	keyTerms: z.array(KeyTermSchema),
	financialTerms: z.object({
		totalValue: z.number().nullable(),
		currency: z.string().nullable(),
		paymentSchedule: z.string().nullable(),
		penalties: z.array(z.string()),
	}),
	obligations: z.array(ObligationSchema),
	risks: z.array(RiskItemSchema),
	termination: z.object({
		noticePeriod: z.string().nullable(),
		terminationClauses: z.array(z.string()),
		autoRenewal: z.boolean().nullable(),
		renewalTerms: z.string().nullable(),
	}),
	intellectualProperty: z.object({
		ownership: z.string().nullable(),
		licenses: z.array(z.string()),
		restrictions: z.array(z.string()),
	}),
	confidentiality: z.object({
		hasNDA: z.boolean(),
		duration: z.string().nullable(),
		scope: z.string().nullable(),
	}),
	disputeResolution: z.object({
		method: z.string().nullable(),
		venue: z.string().nullable(),
		arbitrationRules: z.string().nullable(),
	}),
	overallRiskScore: z.number().min(0).max(100),
	recommendations: z.array(z.string()),
});

export type ContractAnalyzerOutput = z.infer<
	typeof ContractAnalyzerOutputSchema
>;
