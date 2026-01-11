import { z } from "zod";

export const FeedbackItemSchema = z.object({
	text: z.string().min(1, "Feedback text is required"),
	source: z.string().optional(),
	date: z.string().optional(),
	rating: z.number().min(1).max(5).optional(),
});

export type FeedbackItem = z.infer<typeof FeedbackItemSchema>;

export const FeedbackAnalyzerInputSchema = z.object({
	feedback: z.union([
		z.string().min(1, "Feedback text is required"),
		z
			.array(FeedbackItemSchema)
			.min(1, "At least one feedback item is required"),
	]),
	analysisType: z
		.enum(["individual", "aggregate", "trends"])
		.optional()
		.default("individual"),
});

export type FeedbackAnalyzerInput = z.infer<typeof FeedbackAnalyzerInputSchema>;

export const SentimentAnalysisSchema = z.object({
	overall: z.enum([
		"very_negative",
		"negative",
		"neutral",
		"positive",
		"very_positive",
	]),
	score: z.number().min(-1).max(1),
	emotions: z.object({
		joy: z.number().min(0).max(1),
		anger: z.number().min(0).max(1),
		sadness: z.number().min(0).max(1),
		fear: z.number().min(0).max(1),
		surprise: z.number().min(0).max(1),
		trust: z.number().min(0).max(1),
	}),
});

export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;

export const TopicSchema = z.object({
	name: z.string(),
	sentiment: z.enum(["negative", "neutral", "positive"]),
	mentions: z.number(),
	keyPhrases: z.array(z.string()),
});

export type Topic = z.infer<typeof TopicSchema>;

export const ActionableInsightSchema = z.object({
	category: z.enum(["product", "service", "support", "pricing", "other"]),
	priority: z.enum(["low", "medium", "high", "urgent"]),
	insight: z.string(),
	suggestedAction: z.string(),
	impactedArea: z.string(),
	frequency: z.number(),
});

export type ActionableInsight = z.infer<typeof ActionableInsightSchema>;

export const FeedbackAnalyzerOutputSchema = z.object({
	sentiment: SentimentAnalysisSchema,
	topics: z.array(TopicSchema),
	keyThemes: z.array(z.string()),
	strengths: z.array(z.string()),
	weaknesses: z.array(z.string()),
	actionableInsights: z.array(ActionableInsightSchema),
	customerSegments: z.array(
		z.object({
			segment: z.string(),
			size: z.number(),
			avgSentiment: z.number(),
			topConcerns: z.array(z.string()),
		}),
	),
	competitorMentions: z.array(
		z.object({
			competitor: z.string(),
			context: z.string(),
			sentiment: z.enum(["negative", "neutral", "positive"]),
		}),
	),
	summary: z.string(),
	recommendedPriorities: z.array(z.string()),
	npsIndicator: z.object({
		estimatedScore: z.number().min(-100).max(100).nullable(),
		promoters: z.number().min(0).max(100),
		passives: z.number().min(0).max(100),
		detractors: z.number().min(0).max(100),
	}),
});

export type FeedbackAnalyzerOutput = z.infer<
	typeof FeedbackAnalyzerOutputSchema
>;
