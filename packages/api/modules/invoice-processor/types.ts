import { z } from "zod";

export const InvoiceProcessorInputSchema = z
	.object({
		invoiceText: z.string().optional(),
		// Storage path reference (preferred for file uploads)
		filePath: z.string().optional(),
		bucket: z.string().optional(),
		mimeType: z.string().optional(),
		outputFormat: z
			.enum(["json", "csv", "quickbooks", "xero"])
			.optional()
			.default("json"),
	})
	.refine((data) => data.invoiceText || (data.filePath && data.bucket), {
		message:
			"Either invoice text or a file reference (filePath + bucket) must be provided",
	});

export type InvoiceProcessorInput = z.infer<typeof InvoiceProcessorInputSchema>;

export const LineItemSchema = z.object({
	description: z.string(),
	quantity: z.number().nullable(),
	unitPrice: z.number().nullable(),
	amount: z.number(),
});

export type LineItem = z.infer<typeof LineItemSchema>;

export const InvoiceProcessorOutputSchema = z.object({
	vendor: z.object({
		name: z.string(),
		address: z.string().nullable(),
		phone: z.string().nullable(),
		email: z.string().nullable(),
		taxId: z.string().nullable(),
	}),
	invoice: z.object({
		number: z.string().nullable(),
		date: z.string().nullable(),
		dueDate: z.string().nullable(),
		purchaseOrderNumber: z.string().nullable(),
	}),
	customer: z.object({
		name: z.string().nullable(),
		address: z.string().nullable(),
	}),
	lineItems: z.array(LineItemSchema),
	totals: z.object({
		subtotal: z.number().nullable(),
		tax: z.number().nullable(),
		taxRate: z.string().nullable(),
		discount: z.number().nullable(),
		shipping: z.number().nullable(),
		total: z.number(),
	}),
	paymentInfo: z.object({
		terms: z.string().nullable(),
		method: z.string().nullable(),
		bankDetails: z.string().nullable(),
	}),
	currency: z.string(),
	confidence: z.number().min(0).max(1),
	rawExtractedData: z.record(z.string(), z.unknown()).optional(),
	extractionMetadata: z
		.object({
			usedOcr: z.boolean(),
			ocrConfidence: z.number().min(0).max(1).optional(),
			fileType: z.string().optional(),
		})
		.optional(),
});

export type InvoiceProcessorOutput = z.infer<
	typeof InvoiceProcessorOutputSchema
>;
