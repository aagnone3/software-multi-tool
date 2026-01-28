"use client";

import { config } from "@repo/config";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import {
	AlertCircle,
	AlertTriangle,
	FileText,
	ImageIcon,
	Info,
	Loader2,
	Newspaper,
	Scale,
	Share2,
	Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { cleanArticleTitle } from "../../../../../components/tools/news-analyzer/lib/history-utils";
import {
	FactualRatingBadge,
	type NewsAnalysisOutput,
	NewsAnalyzerResults,
	PoliticalLeanSpectrum,
	SentimentIndicator,
} from "../../../../../components/tools/news-analyzer/news-analyzer-results";

interface SharedNewsAnalysisProps {
	analysisId: string;
}

export function SharedNewsAnalysis({ analysisId }: SharedNewsAnalysisProps) {
	const { data, isLoading, error } = useQuery({
		...orpc.share.getNewsAnalysis.queryOptions({
			input: { analysisId },
		}),
	});

	if (isLoading) {
		return (
			<div className="container mx-auto max-w-4xl px-4 py-8">
				<Card className="p-8">
					<div className="flex items-center justify-center">
						<Loader2 className="mr-2 size-6 animate-spin text-primary" />
						<span>Loading analysis...</span>
					</div>
				</Card>
			</div>
		);
	}

	if (error || !data?.analysis) {
		return (
			<div className="container mx-auto max-w-4xl px-4 py-8">
				<Card className="p-8">
					<Alert variant="error">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							{error instanceof Error
								? error.message
								: "This analysis could not be found. It may have been deleted."}
						</AlertDescription>
					</Alert>
					<div className="mt-6 flex flex-col items-center gap-4">
						<p className="text-sm text-muted-foreground">
							Want to analyze your own news articles?
						</p>
						<Button asChild>
							<Link href="/auth/login?redirect=/app/tools/news-analyzer">
								Get Started Free
							</Link>
						</Button>
					</div>
				</Card>
			</div>
		);
	}

	const { analysis } = data;
	const analysisOutput = analysis.analysis as unknown as NewsAnalysisOutput;
	const articleSource = analysis.sourceUrl ?? analysis.sourceText;
	const isUrl = !!analysis.sourceUrl;
	const ogImage = analysisOutput?.articleMetadata?.ogImage;
	const rawTitle = analysisOutput?.articleMetadata?.title ?? analysis.title;
	const displayTitle = rawTitle
		? cleanArticleTitle(rawTitle)
		: "News Analysis";
	const siteName = analysisOutput?.articleMetadata?.siteName;

	return (
		<div className="container mx-auto max-w-4xl px-4 py-8">
			<div className="space-y-6">
				{/* Page Header */}
				<Link
					href="/"
					className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit"
				>
					<Newspaper className="size-6 text-primary" />
					<div>
						<h1 className="text-2xl font-semibold">
							News Analyzer
						</h1>
						<p className="text-xs text-muted-foreground">
							by {config.appName}
						</p>
					</div>
				</Link>

				{/* CTA Banner */}
				<div className="flex items-center justify-center gap-4 px-4 py-3 rounded-lg bg-primary/5 border border-primary/10">
					<Sparkles className="size-4 text-primary" />
					<p className="text-sm font-medium">
						Analyze your own articles for free!
					</p>
					<Button size="sm" asChild>
						<Link href="/auth/login?redirect=/app/tools/news-analyzer">
							Get Started
						</Link>
					</Button>
				</div>

				{/* Summary Card */}
				<Card>
					<CardHeader>
						<CardTitle>Summary</CardTitle>
						<CardDescription>
							Analyzed on{" "}
							{new Date(analysis.createdAt).toLocaleDateString(
								undefined,
								{
									weekday: "long",
									year: "numeric",
									month: "long",
									day: "numeric",
								},
							)}
							{analysis.createdBy && ` by ${analysis.createdBy}`}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Article Preview with Thumbnail */}
						<div className="flex gap-4">
							{/* Thumbnail - clickable for URL articles */}
							{isUrl ? (
								<a
									href={analysis.sourceUrl ?? "#"}
									target="_blank"
									rel="noopener noreferrer"
									className="relative w-32 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted hover:opacity-80 transition-opacity"
								>
									{ogImage ? (
										<Image
											src={ogImage}
											alt="Article preview"
											fill
											className="object-cover"
											unoptimized
										/>
									) : (
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
								{isUrl ? (
									<a
										href={analysis.sourceUrl ?? "#"}
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
								)}

								{/* Site name if available - linked to source */}
								{siteName && isUrl && (
									<a
										href={analysis.sourceUrl ?? "#"}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs text-muted-foreground hover:text-primary transition-colors"
									>
										{siteName}
									</a>
								)}

								{/* Text excerpt for non-URL articles */}
								{!isUrl && articleSource && (
									<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
										{articleSource.length > 100
											? `${articleSource.slice(0, 100)}...`
											: articleSource}
									</p>
								)}

								{/* Share button */}
								<Button
									variant="outline"
									size="sm"
									className="mt-2"
									onClick={() => {
										const shareUrl = `${window.location.origin}/share/news-analyzer/${analysisId}`;
										navigator.clipboard.writeText(shareUrl);
										toast.success(
											"Share link copied to clipboard",
										);
									}}
								>
									<Share2 className="mr-2 size-4" />
									Share Analysis
								</Button>
							</div>
						</div>

						{/* High-level Metrics */}
						{analysisOutput && (
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
												analysisOutput.bias
													.factualRating
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
											analysisOutput.bias
												.sensationalism <= 3
												? "text-green-500"
												: analysisOutput.bias
															.sensationalism <= 6
													? "text-amber-500"
													: "text-red-500"
										}`}
									>
										{analysisOutput.bias.sensationalism *
											10}
										%
									</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Analysis Results */}
				<NewsAnalyzerResults output={analysisOutput} />

				{/* Footer Branding */}
				<div className="border-t pt-6 text-center">
					<p className="text-sm text-muted-foreground">
						Generated by{" "}
						<Link
							href="/"
							className="font-medium text-primary hover:underline"
						>
							{config.appName}
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
