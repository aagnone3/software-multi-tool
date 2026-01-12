import { z } from "zod";

export const ExpenseItemSchema = z.object({
	description: z.string().min(1, "Description is required"),
	amount: z.number().positive("Amount must be positive"),
	date: z.string().optional(),
	vendor: z.string().optional(),
	paymentMethod: z.string().optional(),
});

export type ExpenseItem = z.infer<typeof ExpenseItemSchema>;

export const ExpenseCategorizerInputSchema = z.object({
	expenses: z.union([
		ExpenseItemSchema,
		z.array(ExpenseItemSchema).min(1, "At least one expense is required"),
	]),
	businessType: z.string().optional(),
	taxYear: z.number().optional(),
	country: z.string().optional().default("US"),
});

export type ExpenseCategorizerInput = z.infer<
	typeof ExpenseCategorizerInputSchema
>;

export const TaxCategorySchema = z.object({
	irsCategory: z.string(),
	scheduleLocation: z.string(),
	isDeductible: z.boolean(),
	deductionPercentage: z.number().min(0).max(100),
	notes: z.string().nullable(),
});

export type TaxCategory = z.infer<typeof TaxCategorySchema>;

export const CategorizedExpenseSchema = z.object({
	originalDescription: z.string(),
	amount: z.number(),
	date: z.string().nullable(),
	vendor: z.string().nullable(),
	category: z.enum([
		"advertising",
		"car_vehicle",
		"commissions_fees",
		"contract_labor",
		"depreciation",
		"employee_benefits",
		"insurance",
		"interest_mortgage",
		"interest_other",
		"legal_professional",
		"office_expense",
		"pension_profit_sharing",
		"rent_lease_equipment",
		"rent_lease_property",
		"repairs_maintenance",
		"supplies",
		"taxes_licenses",
		"travel",
		"meals_entertainment",
		"utilities",
		"wages",
		"other",
		"personal",
	]),
	subcategory: z.string().nullable(),
	taxInfo: TaxCategorySchema,
	confidence: z.number().min(0).max(1),
	flags: z.array(z.string()),
	suggestedNotes: z.string().nullable(),
});

export type CategorizedExpense = z.infer<typeof CategorizedExpenseSchema>;

export const ExpenseCategorizerOutputSchema = z.object({
	categorizedExpenses: z.array(CategorizedExpenseSchema),
	summary: z.object({
		totalAmount: z.number(),
		totalDeductible: z.number(),
		totalNonDeductible: z.number(),
		categoryBreakdown: z.array(
			z.object({
				category: z.string(),
				amount: z.number(),
				count: z.number(),
				deductibleAmount: z.number(),
			}),
		),
	}),
	taxInsights: z.object({
		estimatedDeductions: z.number(),
		potentialRedFlags: z.array(
			z.object({
				expense: z.string(),
				reason: z.string(),
				recommendation: z.string(),
			}),
		),
		missingDocumentation: z.array(z.string()),
		optimizationSuggestions: z.array(z.string()),
	}),
	exportFormats: z.object({
		quickbooksReady: z.boolean(),
		xeroReady: z.boolean(),
		csvAvailable: z.boolean(),
	}),
});

export type ExpenseCategorizerOutput = z.infer<
	typeof ExpenseCategorizerOutputSchema
>;
