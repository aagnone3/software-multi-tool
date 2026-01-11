import { z } from "zod";

export const InvoiceProcessorInputSchema = z.object({
	invoiceText: z.string().min(1, "Invoice text is required"),
	outputFormat: z
		.enum(["json", "csv", "quickbooks", "xero"])
		.optional()
		.default("json"),
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
});

export type InvoiceProcessorOutput = z.infer<
	typeof InvoiceProcessorOutputSchema
>;
