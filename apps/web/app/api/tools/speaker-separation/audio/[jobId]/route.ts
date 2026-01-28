import { getToolJobById } from "@repo/database";
import {
	getDefaultSupabaseProvider,
	shouldUseSupabaseStorage,
} from "@repo/storage";
import { NextResponse } from "next/server";

const AUDIO_BUCKET = "audio-uploads";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ jobId: string }> },
) {
	const { jobId } = await params;

	// Get the job
	const job = await getToolJobById(jobId);

	if (!job) {
		return NextResponse.json({ error: "Job not found" }, { status: 404 });
	}

	if (!job.audioFileUrl) {
		return NextResponse.json(
			{ error: "No audio file associated with this job" },
			{ status: 404 },
		);
	}

	if (!shouldUseSupabaseStorage()) {
		return NextResponse.json(
			{ error: "Storage not configured" },
			{ status: 500 },
		);
	}

	try {
		const provider = getDefaultSupabaseProvider();
		const signedUrl = await provider.getSignedDownloadUrl(
			job.audioFileUrl,
			{
				bucket: AUDIO_BUCKET,
				expiresIn: 3600, // 1 hour
			},
		);

		return NextResponse.json({ url: signedUrl });
	} catch (error) {
		console.error("Failed to get audio download URL:", error);
		return NextResponse.json(
			{ error: "Failed to get audio URL" },
			{ status: 500 },
		);
	}
}
