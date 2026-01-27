import { executePrompt, MODEL_RECOMMENDATIONS } from "@repo/agent-sdk";
import { createNewsAnalysis, type Prisma, type ToolJob } from "@repo/database";
import { logger } from "@repo/logs";
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
	articleMetadata?: {
		title?: string;
		ogImage?: string | null;
		siteName?: string | null;
		byline?: string | null;
	};
}

/**
 * Process a news analyzer job using Claude to analyze article content
 */
export async function processNewsAnalyzerJob(job: ToolJob): Promise<JobResult> {
	const input = job.input as NewsAnalyzerInput;

	logger.info(`[NewsAnalyzer] Starting processing for job: ${job.id}`, {
		hasUrl: !!input.articleUrl,
		hasText: !!input.articleText,
	});

	// Validate input
	if (!input.articleUrl && !input.articleText) {
		logger.error(
			`[NewsAnalyzer] Job ${job.id} failed: No article content provided`,
		);
		return {
			success: false,
			error: "Either articleUrl or articleText must be provided in the job input",
		};
	}

	// Extract content
	let extractedContent: ExtractedContent;

	if (input.articleUrl) {
		logger.info(
			`[NewsAnalyzer] Job ${job.id}: Extracting content from URL`,
			{
				url: input.articleUrl,
			},
		);
		const result = await extractContentFromUrl(input.articleUrl);

		if (!result.success) {
			// Provide more user-friendly error messages based on error type
			let userMessage = result.error;

			logger.error(
				`[NewsAnalyzer] Job ${job.id}: Content extraction failed`,
				{
					errorType: result.errorType,
					error: result.error,
				},
			);

			switch (result.errorType) {
				case "INVALID_URL":
					userMessage =
						"The URL you provided is not valid. Please check the URL and try again.";
					break;
				case "PAYWALL":
					userMessage =
						"This article is behind a paywall and cannot be accessed. Try pasting the article text instead.";
					break;
				case "FETCH_FAILED":
					if (result.error.includes("timeout")) {
						userMessage =
							"The article took too long to load. Please try again or paste the article text instead.";
					} else if (result.error.includes("404")) {
						userMessage =
							"The article could not be found (404). Please check the URL.";
					} else {
						userMessage = `Failed to fetch article: ${result.error}. Try pasting the article text instead.`;
					}
					break;
				case "NO_CONTENT":
					userMessage =
						"No article content could be extracted from this page. Try pasting the article text instead.";
					break;
			}

			return {
				success: false,
				error: userMessage,
			};
		}

		logger.info(
			`[NewsAnalyzer] Job ${job.id}: Content extracted successfully`,
			{
				titleLength: result.data.title?.length || 0,
				contentLength: result.data.textContent?.length || 0,
			},
		);
		extractedContent = result.data;
	} else if (input.articleText) {
		logger.info(`[NewsAnalyzer] Job ${job.id}: Processing pasted text`, {
			textLength: input.articleText.length,
		});
		extractedContent = extractContentFromText(input.articleText);
	} else {
		logger.error(
			`[NewsAnalyzer] Job ${job.id}: No article content provided`,
		);
		return {
			success: false,
			error: "No article content provided",
		};
	}

	// Analyze the article using Claude
	try {
		logger.info(`[NewsAnalyzer] Job ${job.id}: Starting AI analysis`);
		const analysisResult = await analyzeArticle(extractedContent);

		// Add article metadata to the analysis result
		const outputWithMetadata: NewsAnalyzerOutput = {
			...analysisResult,
			articleMetadata: {
				title: extractedContent.title,
				ogImage: extractedContent.ogImage,
				siteName: extractedContent.siteName,
				byline: extractedContent.byline,
			},
		};

		logger.info(
			`[NewsAnalyzer] Job ${job.id}: Analysis completed successfully`,
		);

		// Create NewsAnalysis record for sharing support
		try {
			const newsAnalysis = await createNewsAnalysis(
				{
					sourceUrl: input.articleUrl,
					sourceText: input.articleText,
					title: extractedContent.title,
					analysis:
						outputWithMetadata as unknown as Prisma.InputJsonValue,
					userId: job.userId ?? undefined,
				},
				job.id,
			);
			logger.info(
				`[NewsAnalyzer] Job ${job.id}: Created NewsAnalysis record ${newsAnalysis.id}`,
			);
		} catch (dbError) {
			// Log the error but don't fail the job - the analysis still succeeded
			logger.error(
				`[NewsAnalyzer] Job ${job.id}: Failed to create NewsAnalysis record`,
				{
					error:
						dbError instanceof Error
							? dbError.message
							: String(dbError),
				},
			);
		}

		return {
			success: true,
			output: outputWithMetadata as unknown as Prisma.InputJsonValue,
		};
	} catch (error) {
		logger.error(`[NewsAnalyzer] Job ${job.id}: Analysis failed`, {
			error: error instanceof Error ? error.message : String(error),
		});
		if (error instanceof Error) {
			// Check for common configuration errors and provide helpful messages
			if (error.message.includes("ANTHROPIC_API_KEY")) {
				return {
					success: false,
					error: "AI analysis service is not configured. Please contact support or set up your ANTHROPIC_API_KEY.",
				};
			}

			// Check for rate limiting
			if (
				error.message.includes("rate") ||
				error.message.includes("429")
			) {
				return {
					success: false,
					error: "AI analysis service is currently overloaded. Please try again in a few moments.",
				};
			}

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

	logger.debug("[NewsAnalyzer] Executing AI prompt", {
		model: MODEL_RECOMMENDATIONS.structured,
		titleLength: content.title?.length || 0,
		contentLength: content.textContent?.length || 0,
	});

	const result = await executePrompt(analysisPrompt, {
		model: MODEL_RECOMMENDATIONS.structured, // Haiku is best for structured JSON tasks
		maxTokens: 2048,
		temperature: 0.3, // Lower temperature for more consistent structured output
	});

	logger.debug("[NewsAnalyzer] Received AI response", {
		responseLength: result.content.length,
		startsWithJson: result.content.trim().startsWith("{"),
		startsWithCodeFence: result.content.trim().startsWith("```"),
	});

	// Parse the JSON response
	try {
		// Remove markdown code fences if present
		let jsonText = result.content.trim();
		if (jsonText.startsWith("```")) {
			logger.debug(
				"[NewsAnalyzer] Removing markdown code fences from response",
			);
			// Remove ```json or ``` prefix and ``` suffix
			jsonText = jsonText
				.replace(/^```(?:json)?\s*/i, "")
				.replace(/```\s*$/, "")
				.trim();
		}

		logger.debug("[NewsAnalyzer] Parsing JSON response", {
			jsonLength: jsonText.length,
		});

		const analysis = JSON.parse(jsonText) as NewsAnalyzerOutput;

		// Validate the structure
		if (
			!analysis.summary ||
			!Array.isArray(analysis.summary) ||
			!analysis.bias ||
			!analysis.entities ||
			!analysis.sentiment
		) {
			logger.error("[NewsAnalyzer] Invalid analysis structure received", {
				hasSummary: !!analysis.summary,
				summaryIsArray: Array.isArray(analysis.summary),
				hasBias: !!analysis.bias,
				hasEntities: !!analysis.entities,
				hasSentiment: !!analysis.sentiment,
			});
			throw new Error("Invalid analysis structure received from Claude");
		}

		logger.debug(
			"[NewsAnalyzer] Analysis structure validated successfully",
		);
		return analysis;
	} catch (error) {
		logger.error("[NewsAnalyzer] Failed to parse AI response", {
			error: error instanceof Error ? error.message : "Unknown error",
			responsePreview: result.content.slice(0, 200),
		});
		// If JSON parsing fails, return error with the raw content for debugging
		throw new Error(
			`Failed to parse Claude response as JSON: ${error instanceof Error ? error.message : "Unknown error"}. Raw response: ${result.content.slice(0, 200)}`,
		);
	}
}
