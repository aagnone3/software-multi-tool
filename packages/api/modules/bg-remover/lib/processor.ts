import type { ToolJob } from "@repo/database/prisma/generated/client";
import Replicate from "replicate";
import type { JobResult } from "../../jobs/lib/processor-registry";
import type { BgRemoverInput, BgRemoverOutput } from "../types";
import { BgRemoverErrorCode } from "../types";

/**
 * Process a background removal job using Replicate's RMBG-1.4 model
 *
 * Model: https://replicate.com/lucataco/remove-bg
 * This is a fast, high-quality background removal model
 */
export async function processBgRemoverJob(job: ToolJob): Promise<JobResult> {
	const startTime = Date.now();

	try {
		// Parse input
		const input = job.input as BgRemoverInput;

		// Validate environment
		const apiKey = process.env.REPLICATE_API_TOKEN;
		if (!apiKey) {
			return {
				success: false,
				error: `${BgRemoverErrorCode.API_KEY_MISSING}: REPLICATE_API_TOKEN environment variable is not set`,
			};
		}

		// Initialize Replicate client
		const replicate = new Replicate({
			auth: apiKey,
		});

		// Run the background removal model
		// Using lucataco/remove-bg which is based on RMBG-1.4
		const output = await replicate.run(
			"lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1",
			{
				input: {
					image: input.imageUrl,
				},
			},
		);

		// The output is a URL to the processed image
		if (typeof output !== "string") {
			return {
				success: false,
				error: `${BgRemoverErrorCode.PROCESSING_FAILED}: Unexpected output format from Replicate`,
			};
		}

		const processingTimeMs = Date.now() - startTime;

		// Prepare output
		const result: BgRemoverOutput = {
			resultUrl: output,
			originalUrl: input.imageUrl,
			metadata: {
				processingTimeMs,
				format: input.format || "png",
			},
		};

		return {
			success: true,
			output: result as any,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error occurred";

		return {
			success: false,
			error: `${BgRemoverErrorCode.PROCESSING_FAILED}: ${errorMessage}`,
		};
	}
}
