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
} from "@ui/components/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	FileText,
	ImageIcon,
	Info,
	Loader2,
	MoreVertical,
	Newspaper,
	RefreshCw,
	Scale,
	Share2,
	Trash2,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
	cleanArticleTitle,
	type JobStatus,
	type NewsAnalyzerJob,
	statusConfig,
} from "./lib/history-utils";
import {
	FactualRatingBadge,
	NewsAnalyzerResults,
	PoliticalLeanSpectrum,
	SentimentIndicator,
} from "./news-analyzer-results";

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

	// Get analysis output (prefer persisted NewsAnalysis over job.output)
	const analysisOutput = job.newsAnalysis?.analysis ?? job.output;

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Newspaper className="size-6 text-primary" />
					<h1 className="text-2xl font-semibold">News Analyzer</h1>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="ghost" size="sm" asChild>
						<Link href="/app/tools/news-analyzer?tab=history">
							Back to History
						</Link>
					</Button>

					{/* Options Dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon">
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{job.status === "COMPLETED" &&
								job.newsAnalysis?.id && (
									<>
										<DropdownMenuItem
											onClick={() => {
												const shareUrl = `${window.location.origin}/share/news-analyzer/${job.newsAnalysis?.id}`;
												navigator.clipboard.writeText(
													shareUrl,
												);
												toast.success(
													"Share link copied to clipboard",
												);
											}}
										>
											<Share2 className="mr-2 size-4" />
											Copy Share Link
										</DropdownMenuItem>
										<DropdownMenuSeparator />
									</>
								)}
							<DropdownMenuItem
								onClick={() => reanalyzeMutation.mutate()}
								disabled={reanalyzeMutation.isPending}
							>
								{reanalyzeMutation.isPending ? (
									<Loader2 className="mr-2 size-4 animate-spin" />
								) : (
									<RefreshCw className="mr-2 size-4" />
								)}
								Re-analyze
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setIsDeleteDialogOpen(true)}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="mr-2 size-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Delete Dialog */}
					<Dialog
						open={isDeleteDialogOpen}
						onOpenChange={setIsDeleteDialogOpen}
					>
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

			{/* Summary Card */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Summary</CardTitle>
						<StatusBadge status={job.status} />
					</div>
					<CardDescription>
						{new Date(job.createdAt).toLocaleDateString(undefined, {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
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
							{(() => {
								const rawTitle =
									job.output?.articleMetadata?.title ||
									job.newsAnalysis?.analysis?.articleMetadata
										?.title ||
									job.newsAnalysis?.title;
								if (!rawTitle) return null;
								const displayTitle =
									cleanArticleTitle(rawTitle);
								return isUrl ? (
									<a
										href={job.input.articleUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="font-medium text-sm mb-1 line-clamp-2 hover:text-primary transition-colors block"
									>
										{displayTitle}
									</a>
								) : (
									<p className="font-medium text-sm mb-1 line-clamp-2">
										{displayTitle}
									</p>
								);
							})()}

							{/* Site name if available - linked to source */}
							{(job.output?.articleMetadata?.siteName ||
								job.newsAnalysis?.analysis?.articleMetadata
									?.siteName) &&
								isUrl && (
									<a
										href={job.input.articleUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs text-muted-foreground hover:text-primary transition-colors"
									>
										{job.output?.articleMetadata
											?.siteName ||
											job.newsAnalysis?.analysis
												?.articleMetadata?.siteName}
									</a>
								)}

							{/* Text excerpt for non-URL articles */}
							{!isUrl && (
								<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
									{articleSource && articleSource.length > 100
										? `${articleSource.slice(0, 100)}...`
										: articleSource}
								</p>
							)}

							{/* Share button - only show when completed and shareable */}
							{job.status === "COMPLETED" &&
								job.newsAnalysis?.id && (
									<Button
										variant="outline"
										size="sm"
										className="mt-2"
										onClick={() => {
											const shareUrl = `${window.location.origin}/share/news-analyzer/${job.newsAnalysis?.id}`;
											navigator.clipboard.writeText(
												shareUrl,
											);
											toast.success(
												"Share link copied to clipboard",
											);
										}}
									>
										<Share2 className="mr-2 size-4" />
										Share Analysis
									</Button>
								)}
						</div>
					</div>

					{/* High-level Metrics (only show when completed) */}
					{job.status === "COMPLETED" && analysisOutput && (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t">
							<div className="p-3 rounded-lg bg-muted/50">
								<Scale className="mx-auto mb-2 size-5 text-muted-foreground" />
								<p className="text-xs text-muted-foreground text-center mb-2">
									Political Lean
								</p>
								<PoliticalLeanSpectrum
									lean={analysisOutput.bias.politicalLean}
									compact
								/>
							</div>
							<div className="text-center p-3 rounded-lg bg-muted/50">
								<SentimentIndicator
									sentiment={analysisOutput.sentiment}
								/>
							</div>
							<div className="text-center p-3 rounded-lg bg-muted/50">
								<Info className="mx-auto mb-2 size-5 text-muted-foreground" />
								<p className="text-xs text-muted-foreground">
									Factual Rating
								</p>
								<div className="mt-1">
									<FactualRatingBadge
										rating={
											analysisOutput.bias.factualRating
										}
									/>
								</div>
							</div>
							<div className="text-center p-3 rounded-lg bg-muted/50">
								<AlertTriangle className="mx-auto mb-2 size-5 text-muted-foreground" />
								<p className="text-xs text-muted-foreground">
									Sensationalism
								</p>
								<p
									className={`mt-1 text-lg font-bold tabular-nums ${
										analysisOutput.bias.sensationalism <= 3
											? "text-green-500"
											: analysisOutput.bias
														.sensationalism <= 6
												? "text-amber-500"
												: "text-red-500"
									}`}
								>
									{analysisOutput.bias.sensationalism * 10}%
								</p>
							</div>
						</div>
					)}
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

			{/* Share CTA at bottom */}
			{job.status === "COMPLETED" && job.newsAnalysis?.id && (
				<Card className="bg-primary/5 border-primary/20">
					<CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
						<div className="text-center sm:text-left">
							<p className="font-medium">
								Found this analysis helpful?
							</p>
							<p className="text-sm text-muted-foreground">
								Share it with others to help them stay informed.
							</p>
						</div>
						<Button
							onClick={() => {
								const shareUrl = `${window.location.origin}/share/news-analyzer/${job.newsAnalysis?.id}`;
								navigator.clipboard.writeText(shareUrl);
								toast.success("Share link copied to clipboard");
							}}
						>
							<Share2 className="mr-2 size-4" />
							Copy Share Link
						</Button>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
