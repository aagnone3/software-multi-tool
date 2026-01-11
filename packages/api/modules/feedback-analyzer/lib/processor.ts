import { executePrompt } from "@repo/agent-sdk";
import type { Prisma, ToolJob } from "@repo/database/prisma/generated/client";
import type { JobResult } from "../../jobs/lib/processor-registry";
import type { FeedbackAnalyzerInput, FeedbackAnalyzerOutput } from "../types";

const FEEDBACK_ANALYSIS_PROMPT = `You are an expert customer feedback analyst. Analyze the following customer feedback and extract actionable insights.

IMPORTANT: Return ONLY valid JSON with no additional text or explanation. The JSON must conform exactly to this schema:

{
  "sentiment": {
    "overall": "very_negative | negative | neutral | positive | very_positive",
    "score": "number between -1 (most negative) and 1 (most positive)",
    "emotions": {
      "joy": "number 0-1",
      "anger": "number 0-1",
      "sadness": "number 0-1",
      "fear": "number 0-1",
      "surprise": "number 0-1",
      "trust": "number 0-1"
    }
  },
  "topics": [
    {
      "name": "string",
      "sentiment": "negative | neutral | positive",
      "mentions": "number",
      "keyPhrases": ["array of representative phrases"]
    }
  ],
  "keyThemes": ["array of overarching themes"],
  "strengths": ["array of positive aspects mentioned"],
  "weaknesses": ["array of negative aspects or complaints"],
  "actionableInsights": [
    {
      "category": "product | service | support | pricing | other",
      "priority": "low | medium | high | urgent",
      "insight": "string",
      "suggestedAction": "string",
      "impactedArea": "string",
      "frequency": "number (how many times this was mentioned)"
    }
  ],
  "customerSegments": [
    {
      "segment": "string (e.g., 'Power Users', 'New Customers')",
      "size": "number (percentage)",
      "avgSentiment": "number -1 to 1",
      "topConcerns": ["array of concerns"]
    }
  ],
  "competitorMentions": [
    {
      "competitor": "string",
      "context": "string",
      "sentiment": "negative | neutral | positive"
    }
  ],
  "summary": "string (comprehensive summary paragraph)",
  "recommendedPriorities": ["ordered array of top priorities to address"],
  "npsIndicator": {
    "estimatedScore": "number -100 to 100 or null",
    "promoters": "number (percentage 0-100)",
    "passives": "number (percentage 0-100)",
    "detractors": "number (percentage 0-100)"
  }
}

Guidelines:
- Identify patterns across multiple pieces of feedback
- Prioritize insights by business impact
- Be specific in actionable recommendations
- Detect competitor mentions and context
- Estimate NPS based on sentiment indicators
- Group similar feedback into themes

Customer feedback to analyze:
`;

export async function processFeedbackJob(job: ToolJob): Promise<JobResult> {
	const input = job.input as unknown as FeedbackAnalyzerInput;

	const feedbackText =
		typeof input.feedback === "string"
			? input.feedback
			: input.feedback.map((f) => f.text).join("\n\n---\n\n");

	if (!feedbackText || feedbackText.trim().length === 0) {
		return {
			success: false,
			error: "Feedback text is required",
		};
	}

	try {
		const result = await executePrompt(
			`${FEEDBACK_ANALYSIS_PROMPT}\n\n${feedbackText}`,
			{
				model: "claude-3-5-sonnet-20241022",
				maxTokens: 8192,
				temperature: 0.2,
				system: "You are an expert customer feedback analyst. Output only valid JSON. Focus on actionable insights.",
			},
		);

		const analysisData = JSON.parse(
			result.content,
		) as FeedbackAnalyzerOutput;

		const output: FeedbackAnalyzerOutput = {
			sentiment: {
				overall: analysisData.sentiment?.overall ?? "neutral",
				score: analysisData.sentiment?.score ?? 0,
				emotions: {
					joy: analysisData.sentiment?.emotions?.joy ?? 0,
					anger: analysisData.sentiment?.emotions?.anger ?? 0,
					sadness: analysisData.sentiment?.emotions?.sadness ?? 0,
					fear: analysisData.sentiment?.emotions?.fear ?? 0,
					surprise: analysisData.sentiment?.emotions?.surprise ?? 0,
					trust: analysisData.sentiment?.emotions?.trust ?? 0,
				},
			},
			topics: analysisData.topics ?? [],
			keyThemes: analysisData.keyThemes ?? [],
			strengths: analysisData.strengths ?? [],
			weaknesses: analysisData.weaknesses ?? [],
			actionableInsights: analysisData.actionableInsights ?? [],
			customerSegments: analysisData.customerSegments ?? [],
			competitorMentions: analysisData.competitorMentions ?? [],
			summary: analysisData.summary ?? "",
			recommendedPriorities: analysisData.recommendedPriorities ?? [],
			npsIndicator: {
				estimatedScore:
					analysisData.npsIndicator?.estimatedScore ?? null,
				promoters: analysisData.npsIndicator?.promoters ?? 0,
				passives: analysisData.npsIndicator?.passives ?? 0,
				detractors: analysisData.npsIndicator?.detractors ?? 0,
			},
		};

		return {
			success: true,
			output: output as unknown as Prisma.InputJsonValue,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error
				? error.message
				: "Failed to analyze feedback";
		return {
			success: false,
			error: errorMessage,
		};
	}
}
