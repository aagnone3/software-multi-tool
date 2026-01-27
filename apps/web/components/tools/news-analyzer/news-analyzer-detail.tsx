"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/alert";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	FileText,
	ImageIcon,
	Link2,
	Loader2,
	RefreshCw,
	Timer,
	Trash2,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	formatDuration,
	type JobStatus,
	type NewsAnalyzerJob,
	statusConfig,
} from "./lib/history-utils";
import { NewsAnalyzerResults } from "./news-analyzer-results";

interface NewsAnalyzerDetailProps {
	jobId: string;
}

const statusIcons: Record<
	JobStatus,
	React.ComponentType<{ className?: string }>
> = {
	PENDING: Clock,
	PROCESSING: Loader2,
	COMPLETED: CheckCircle2,
	FAILED: XCircle,
	CANCELLED: AlertCircle,
};

function StatusBadge({ status }: { status: JobStatus }) {
	const config = statusConfig[status];
	const Icon = statusIcons[status];

	return (
		<Badge
			status={
				config.variant === "success"
					? "success"
					: config.variant === "error"
						? "error"
						: config.variant === "warning"
							? "warning"
							: "info"
			}
		>
			<Icon
				className={`size-3 mr-1 ${status === "PROCESSING" ? "animate-spin" : ""}`}
			/>
			{config.label}
		</Badge>
	);
}

export function NewsAnalyzerDetail({ jobId }: NewsAnalyzerDetailProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const { data, isLoading, error } = useQuery({
		...orpc.jobs.get.queryOptions({
			input: { jobId },
		}),
		refetchInterval: (query) => {
			// Keep polling if job is still processing
			const job = query.state.data?.job as NewsAnalyzerJob | undefined;
			if (job?.status === "PENDING" || job?.status === "PROCESSING") {
				return 2000;
			}
			return false;
		},
	});

	const job = data?.job as NewsAnalyzerJob | undefined;

	// Re-analyze mutation
	const reanalyzeMutation = useMutation({
		mutationFn: async () => {
			if (!job) throw new Error("No job data");

			const sessionId =
				typeof window !== "undefined"
					? (localStorage.getItem("news-analyzer-session-id") ??
						undefined)
					: undefined;

			const response = await orpcClient.jobs.create({
				toolSlug: "news-analyzer",
				input: job.input,
				sessionId,
			});

			return response;
		},
		onSuccess: (data) => {
			toast.success("Re-analysis started");
			// Navigate to the new job's detail page
			router.push(`/app/tools/news-analyzer/${data.job.id}`);
		},
		onError: (err) => {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to start re-analysis",
			);
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async () => {
			await orpcClient.jobs.delete({ jobId });
		},
		onSuccess: () => {
			toast.success("Analysis deleted");
			// Invalidate the jobs list cache
			queryClient.invalidateQueries({ queryKey: ["jobs", "list"] });
			// Navigate back to history
			router.push("/app/tools/news-analyzer?tab=history");
		},
		onError: (err) => {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to delete analysis",
			);
		},
	});

	if (isLoading) {
		return (
			<Card className="p-8">
				<div className="flex items-center justify-center">
					<Loader2 className="mr-2 size-6 animate-spin text-primary" />
					<span>Loading analysis...</span>
				</div>
			</Card>
		);
	}

	if (error || !job) {
		return (
			<Card className="p-8">
				<Alert variant="error">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						{error instanceof Error
							? error.message
							: "Failed to load analysis. It may have been deleted or expired."}
					</AlertDescription>
				</Alert>
				<div className="mt-4 flex justify-center">
					<Button variant="outline" asChild>
						<Link href="/app/tools/news-analyzer?tab=history">
							<ArrowLeft className="mr-2 size-4" />
							Back to History
						</Link>
					</Button>
				</div>
			</Card>
		);
	}

	const articleSource = job.input.articleUrl ?? job.input.articleText;
	const isUrl = !!job.input.articleUrl;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<Button variant="ghost" asChild>
					<Link href="/app/tools/news-analyzer?tab=history">
						<ArrowLeft className="mr-2 size-4" />
						Back to History
					</Link>
				</Button>

				<div className="flex items-center gap-2">
					{/* Copy Share Link - only show for completed jobs with newsAnalysis */}
					{job.status === "COMPLETED" && job.newsAnalysis?.id && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								const shareUrl = `${window.location.origin}/share/news-analyzer/${job.newsAnalysis?.id}`;
								navigator.clipboard.writeText(shareUrl);
								toast.success("Share link copied to clipboard");
							}}
						>
							<Link2 className="mr-2 size-4" />
							Copy link
						</Button>
					)}

					<Button
						variant="outline"
						size="sm"
						onClick={() => reanalyzeMutation.mutate()}
						disabled={reanalyzeMutation.isPending}
					>
						{reanalyzeMutation.isPending ? (
							<Loader2 className="mr-2 size-4 animate-spin" />
						) : (
							<RefreshCw className="mr-2 size-4" />
						)}
						Re-analyze
					</Button>

					<Dialog
						open={isDeleteDialogOpen}
						onOpenChange={setIsDeleteDialogOpen}
					>
						<DialogTrigger asChild>
							<Button variant="outline" size="sm">
								<Trash2 className="mr-2 size-4" />
								Delete
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Delete Analysis</DialogTitle>
								<DialogDescription>
									Are you sure you want to delete this
									analysis? This action cannot be undone.
								</DialogDescription>
							</DialogHeader>
							<DialogFooter>
								<Button
									variant="outline"
									onClick={() => setIsDeleteDialogOpen(false)}
								>
									Cancel
								</Button>
								<Button
									variant="error"
									onClick={() => {
										deleteMutation.mutate();
										setIsDeleteDialogOpen(false);
									}}
									disabled={deleteMutation.isPending}
								>
									{deleteMutation.isPending ? (
										<Loader2 className="mr-2 size-4 animate-spin" />
									) : null}
									Delete
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{/* Metadata Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Analysis Details</CardTitle>
						<StatusBadge status={job.status} />
					</div>
					<CardDescription>
						Submitted on{" "}
						{new Date(job.createdAt).toLocaleDateString(undefined, {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Article Preview with Thumbnail */}
					<div className="flex gap-4">
						{/* Thumbnail - clickable for URL articles */}
						{isUrl ? (
							<a
								href={job.input.articleUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="relative w-32 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted hover:opacity-80 transition-opacity"
							>
								{(job.output?.articleMetadata?.ogImage ||
									job.newsAnalysis?.analysis?.articleMetadata
										?.ogImage) && (
									<Image
										src={
											job.output?.articleMetadata
												?.ogImage ||
											job.newsAnalysis?.analysis
												?.articleMetadata?.ogImage ||
											""
										}
										alt="Article preview"
										fill
										className="object-cover"
										unoptimized
									/>
								)}
								{!job.output?.articleMetadata?.ogImage &&
									!job.newsAnalysis?.analysis?.articleMetadata
										?.ogImage && (
										<div className="absolute inset-0 flex items-center justify-center">
											<ImageIcon className="size-8 text-muted-foreground/50" />
										</div>
									)}
							</a>
						) : (
							<div className="relative w-32 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
								<div className="absolute inset-0 flex items-center justify-center">
									<FileText className="size-8 text-muted-foreground/50" />
								</div>
							</div>
						)}

						{/* Source Info */}
						<div className="flex-1 min-w-0">
							{/* Title from metadata - clickable for URL articles */}
							{(job.output?.articleMetadata?.title ||
								job.newsAnalysis?.analysis?.articleMetadata
									?.title ||
								job.newsAnalysis?.title) &&
								(isUrl ? (
									<a
										href={job.input.articleUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary transition-colors block"
									>
										{job.output?.articleMetadata?.title ||
											job.newsAnalysis?.analysis
												?.articleMetadata?.title ||
											job.newsAnalysis?.title}
									</a>
								) : (
									<p className="font-medium text-sm mb-1 line-clamp-2">
										{job.output?.articleMetadata?.title ||
											job.newsAnalysis?.analysis
												?.articleMetadata?.title ||
											job.newsAnalysis?.title}
									</p>
								))}

							{/* Site name if available */}
							{(job.output?.articleMetadata?.siteName ||
								job.newsAnalysis?.analysis?.articleMetadata
									?.siteName) && (
								<p className="text-xs text-muted-foreground">
									{job.output?.articleMetadata?.siteName ||
										job.newsAnalysis?.analysis
											?.articleMetadata?.siteName}
								</p>
							)}

							{/* Text excerpt for non-URL articles */}
							{!isUrl && (
								<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
									{articleSource && articleSource.length > 100
										? `${articleSource.slice(0, 100)}...`
										: articleSource}
								</p>
							)}
						</div>
					</div>

					{/* Processing Info */}
					<div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2 border-t">
						<div>
							<p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
								<Timer className="size-3.5" />
								Processing Time
							</p>
							<p className="text-sm">
								{formatDuration(job.startedAt, job.completedAt)}
							</p>
						</div>
						{job.completedAt && (
							<div>
								<p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
									<Clock className="size-3.5" />
									Completed
								</p>
								<p className="text-sm">
									{new Date(
										job.completedAt,
									).toLocaleTimeString()}
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Processing State */}
			{(job.status === "PENDING" || job.status === "PROCESSING") && (
				<Card className="p-8">
					<div className="flex flex-col items-center justify-center text-center">
						<Loader2 className="size-8 animate-spin text-primary mb-4" />
						<p className="text-muted-foreground">
							{job.status === "PENDING"
								? "Analysis queued..."
								: "Analyzing article..."}
						</p>
						<p className="text-sm text-muted-foreground mt-2">
							This may take 10-30 seconds
						</p>
					</div>
				</Card>
			)}

			{/* Error State */}
			{job.status === "FAILED" && (
				<Alert variant="error">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						{job.error ?? "Analysis failed. Please try again."}
					</AlertDescription>
				</Alert>
			)}

			{/* Cancelled State */}
			{job.status === "CANCELLED" && (
				<Alert variant="error">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						This analysis was cancelled.
					</AlertDescription>
				</Alert>
			)}

			{/* Results - prefer NewsAnalysis data over job.output for durability */}
			{job.status === "COMPLETED" &&
				(job.newsAnalysis?.analysis ? (
					<NewsAnalyzerResults output={job.newsAnalysis.analysis} />
				) : job.output ? (
					<NewsAnalyzerResults output={job.output} />
				) : null)}
		</div>
	);
}
