import { executePrompt } from "@repo/agent-sdk";
import type { Prisma } from "@repo/database/prisma/generated/client";
import type { JobResult } from "../../jobs/lib/processor-registry";
import {
	type ExtractedContent,
	extractContentFromText,
	extractContentFromUrl,
} from "./content-extractor";

interface NewsAnalyzerInput {
	articleUrl?: string;
	articleText?: string;
	options?: {
		includeSources?: boolean;
		includeRelated?: boolean;
	};
}

interface BiasAnalysis {
	politicalLean: string;
	sensationalism: number;
	factualRating: string;
}

interface EntitiesAnalysis {
	people: string[];
	organizations: string[];
	places: string[];
}

interface NewsAnalyzerOutput {
	summary: string[];
	bias: BiasAnalysis;
	entities: EntitiesAnalysis;
	sentiment: string;
	sourceCredibility?: string;
	relatedContext?: string[];
}

/**
 * Process a news analyzer job using Claude to analyze article content
 */
export async function processNewsAnalyzerJob(job: {
	id: string;
	input: unknown;
}): Promise<JobResult> {
	const input = job.input as NewsAnalyzerInput;

	// Validate input
	if (!input.articleUrl && !input.articleText) {
		return {
			success: false,
			error: "Either articleUrl or articleText must be provided in the job input",
		};
	}

	// Extract content
	let extractedContent: ExtractedContent;

	if (input.articleUrl) {
		const result = await extractContentFromUrl(input.articleUrl);

		if (!result.success) {
			return {
				success: false,
				error: result.error,
			};
		}

		extractedContent = result.data;
	} else if (input.articleText) {
		extractedContent = extractContentFromText(input.articleText);
	} else {
		return {
			success: false,
			error: "No article content provided",
		};
	}

	// Analyze the article using Claude
	try {
		const analysisResult = await analyzeArticle(extractedContent);

		return {
			success: true,
			output: analysisResult as unknown as Prisma.InputJsonValue,
		};
	} catch (error) {
		if (error instanceof Error) {
			return {
				success: false,
				error: `Analysis failed: ${error.message}`,
			};
		}
		return {
			success: false,
			error: "Analysis failed: Unknown error",
		};
	}
}

/**
 * Analyze article content using Claude with multiple targeted prompts
 */
async function analyzeArticle(
	content: ExtractedContent,
): Promise<NewsAnalyzerOutput> {
	// Use comprehensive prompt to analyze all aspects at once
	const analysisPrompt = `You are an expert news analyst. Analyze the following article and provide a structured analysis.

Article Title: ${content.title}
${content.byline ? `Author: ${content.byline}` : ""}
${content.siteName ? `Source: ${content.siteName}` : ""}

Article Content:
${content.textContent}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):

{
  "summary": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "bias": {
    "politicalLean": "Left|Center-Left|Center|Center-Right|Right",
    "sensationalism": 0-10,
    "factualRating": "High|Medium|Low"
  },
  "entities": {
    "people": ["person 1", "person 2"],
    "organizations": ["org 1", "org 2"],
    "places": ["place 1", "place 2"]
  },
  "sentiment": "Positive|Neutral|Negative",
  "sourceCredibility": "High|Medium|Low|Unknown"
}

Analysis requirements:
- summary: 3-5 key points from the article
- politicalLean: Assess the political bias/lean of the content
- sensationalism: Rate 0 (factual) to 10 (highly sensational)
- factualRating: Evaluate how factual vs opinion-based the article is
- entities: Extract key people, organizations, and places mentioned
- sentiment: Overall tone and sentiment of the article
- sourceCredibility: Based on the source name if available

Respond with ONLY the JSON object, no additional text or markdown formatting.`;

	const result = await executePrompt(analysisPrompt, {
		model: "claude-3-5-sonnet-20241022",
		maxTokens: 2048,
		temperature: 0.3, // Lower temperature for more consistent structured output
	});

	// Parse the JSON response
	try {
		// Remove markdown code fences if present
		let jsonText = result.content.trim();
		if (jsonText.startsWith("```")) {
			// Remove ```json or ``` prefix and ``` suffix
			jsonText = jsonText
				.replace(/^```(?:json)?\s*/i, "")
				.replace(/```\s*$/, "")
				.trim();
		}

		const analysis = JSON.parse(jsonText) as NewsAnalyzerOutput;

		// Validate the structure
		if (
			!analysis.summary ||
			!Array.isArray(analysis.summary) ||
			!analysis.bias ||
			!analysis.entities ||
			!analysis.sentiment
		) {
			throw new Error("Invalid analysis structure received from Claude");
		}

		return analysis;
	} catch (error) {
		// If JSON parsing fails, return error with the raw content for debugging
		throw new Error(
			`Failed to parse Claude response as JSON: ${error instanceof Error ? error.message : "Unknown error"}. Raw response: ${result.content.slice(0, 200)}`,
		);
	}
}
