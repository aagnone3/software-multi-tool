"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import {
	AlertCircle,
	CheckCircle2,
	Download,
	Loader2,
	Upload,
	X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const SUPPORTED_FORMATS = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface JobStatus {
	id: string;
	status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
	result?: {
		resultUrl: string;
		originalUrl: string;
		metadata?: {
			processingTimeMs?: number;
			format: string;
		};
	};
	error?: string;
}

export function BgRemoverClient() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sessionId] = useState(() => {
		// Generate a session ID for anonymous users
		if (typeof window !== "undefined") {
			let id = localStorage.getItem("bg-remover-session-id");
			if (!id) {
				id = `anon-${Date.now()}-${Math.random().toString(36).substring(7)}`;
				localStorage.setItem("bg-remover-session-id", id);
			}
			return id;
		}
		return `anon-${Date.now()}`;
	});

	const onDrop = useCallback((acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) {
			return;
		}

		// Validate file type
		if (!SUPPORTED_FORMATS.includes(file.type)) {
			setError(
				"Unsupported format. Please upload PNG, JPEG, or WebP images.",
			);
			return;
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			setError("File too large. Maximum size is 10MB.");
			return;
		}

		setError(null);
		setSelectedFile(file);

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setPreviewUrl(reader.result as string);
		};
		reader.readAsDataURL(file);
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"image/png": [".png"],
			"image/jpeg": [".jpg", ".jpeg"],
			"image/webp": [".webp"],
		},
		maxFiles: 1,
		multiple: false,
	});

	const clearFile = () => {
		setSelectedFile(null);
		setPreviewUrl(null);
		setJobStatus(null);
		setError(null);
	};

	const processImage = async () => {
		if (!selectedFile || !previewUrl) {
			return;
		}

		setIsUploading(true);
		setError(null);

		try {
			// Create job with the preview URL (base64 data URL)
			const response = await orpcClient.jobs.create({
				toolSlug: "bg-remover",
				input: {
					imageUrl: previewUrl,
					format: "png",
				},
				sessionId,
			});

			setJobStatus({
				id: response.job.id,
				status: response.job.status as any,
			});

			// Start polling for job completion
			pollJobStatus(response.job.id);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to process image",
			);
			setIsUploading(false);
		}
	};

	const pollJobStatus = async (jobId: string) => {
		const poll = async () => {
			try {
				const response = await orpcClient.jobs.get({
					jobId,
				});

				const status = response.job.status as any;
				const output = response.job.output as any;
				const error = response.job.error;

				setJobStatus({
					id: jobId,
					status,
					result: output,
					error: error ?? undefined,
				});

				if (status === "COMPLETED" || status === "FAILED") {
					setIsUploading(false);
					return;
				}

				// Continue polling
				setTimeout(poll, 2000);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to check job status",
				);
				setIsUploading(false);
			}
		};

		await poll();
	};

	const downloadResult = () => {
		if (!jobStatus?.result?.resultUrl) {
			return;
		}

		const link = document.createElement("a");
		link.href = jobStatus.result.resultUrl;
		link.download = `bg-removed-${Date.now()}.png`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<div className="container max-w-4xl px-4 py-8 space-y-8">
			<div>
				<h1 className="text-3xl font-bold">Background Remover</h1>
				<p className="mt-2 text-muted-foreground">
					Remove backgrounds from images with AI. Supports PNG, JPEG,
					and WebP formats up to 10MB.
				</p>
			</div>

			{error && (
				<Alert variant="error">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Upload Image</CardTitle>
					<CardDescription>
						Drag and drop an image or click to select
					</CardDescription>
				</CardHeader>
				<CardContent>
					{!selectedFile ? (
						<div
							{...getRootProps()}
							className={`
								border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
								transition-colors
								${
									isDragActive
										? "border-primary bg-primary/5"
										: "border-muted-foreground/25 hover:border-primary/50"
								}
							`}
						>
							<input {...getInputProps()} />
							<Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
							<p className="text-lg font-medium">
								{isDragActive
									? "Drop the image here"
									: "Drag and drop an image here"}
							</p>
							<p className="text-sm text-muted-foreground mt-2">
								or click to browse your files
							</p>
							<p className="text-xs text-muted-foreground mt-4">
								Supported formats: PNG, JPEG, WebP (max 10MB)
							</p>
						</div>
					) : (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium">
										{selectedFile.name}
									</span>
									<span className="text-xs text-muted-foreground">
										(
										{(
											selectedFile.size /
											1024 /
											1024
										).toFixed(2)}{" "}
										MB)
									</span>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={clearFile}
									disabled={isUploading}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>

							{previewUrl && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<p className="text-sm font-medium mb-2">
											Original
										</p>
										{/* biome-ignore lint/performance/noImgElement: base64 data URL doesn't benefit from Next.js optimization */}
										<img
											src={previewUrl}
											alt="Original"
											className="w-full rounded-lg border"
										/>
									</div>

									{jobStatus?.result?.resultUrl && (
										<div>
											<p className="text-sm font-medium mb-2">
												Result
											</p>
											{/* biome-ignore lint/performance/noImgElement: external Replicate URL doesn't benefit from Next.js optimization */}
											<img
												src={jobStatus.result.resultUrl}
												alt="Result"
												className="w-full rounded-lg border"
											/>
										</div>
									)}
								</div>
							)}

							{jobStatus && (
								<div className="space-y-2">
									{jobStatus.status === "PENDING" && (
										<div className="flex items-center gap-2 text-sm">
											<Loader2 className="h-4 w-4 animate-spin" />
											<span>
												Job queued, waiting to start...
											</span>
										</div>
									)}

									{jobStatus.status === "PROCESSING" && (
										<div className="space-y-2">
											<div className="flex items-center gap-2 text-sm">
												<Loader2 className="h-4 w-4 animate-spin" />
												<span>Processing image...</span>
											</div>
											<Progress className="w-full" />
										</div>
									)}

									{jobStatus.status === "COMPLETED" && (
										<div className="space-y-4">
											<Alert>
												<CheckCircle2 className="h-4 w-4" />
												<AlertTitle>Success</AlertTitle>
												<AlertDescription>
													Background removed
													successfully!
													{jobStatus.result?.metadata
														?.processingTimeMs && (
														<span className="ml-1">
															(Took{" "}
															{(
																jobStatus.result
																	.metadata
																	.processingTimeMs /
																1000
															).toFixed(1)}
															s)
														</span>
													)}
												</AlertDescription>
											</Alert>

											<Button
												onClick={downloadResult}
												className="w-full"
											>
												<Download className="mr-2 h-4 w-4" />
												Download Result
											</Button>
										</div>
									)}

									{jobStatus.status === "FAILED" && (
										<Alert variant="error">
											<AlertCircle className="h-4 w-4" />
											<AlertTitle>
												Processing Failed
											</AlertTitle>
											<AlertDescription>
												{jobStatus.error ||
													"An unknown error occurred"}
											</AlertDescription>
										</Alert>
									)}
								</div>
							)}

							{!jobStatus && (
								<Button
									onClick={processImage}
									disabled={isUploading}
									className="w-full"
								>
									{isUploading ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Processing...
										</>
									) : (
										<>
											<Upload className="mr-2 h-4 w-4" />
											Remove Background
										</>
									)}
								</Button>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
