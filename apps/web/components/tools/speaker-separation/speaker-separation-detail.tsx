"use client";

import type {
	SpeakerSegment,
	SpeakerSeparationOutput,
} from "@repo/api/modules/speaker-separation/types";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/alert";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import { cn } from "@ui/lib";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	CopyIcon,
	DownloadIcon,
	FileTextIcon,
	Loader2,
	PauseIcon,
	PlayIcon,
	RefreshCw,
	Trash2,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	formatDuration,
	formatProcessingDuration,
	getDuration,
	getFilename,
	type JobStatus,
	type SpeakerSeparationJob,
	statusConfig,
} from "./lib/history-utils";

interface SpeakerSeparationDetailProps {
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

/**
 * Speaker colors - refined palette with better contrast
 */
const SPEAKER_COLORS = [
	{
		bg: "bg-blue-50 dark:bg-blue-950/40",
		text: "text-blue-700 dark:text-blue-300",
		bar: "bg-blue-500",
		border: "border-blue-200 dark:border-blue-800",
		ring: "ring-blue-500/30",
	},
	{
		bg: "bg-emerald-50 dark:bg-emerald-950/40",
		text: "text-emerald-700 dark:text-emerald-300",
		bar: "bg-emerald-500",
		border: "border-emerald-200 dark:border-emerald-800",
		ring: "ring-emerald-500/30",
	},
	{
		bg: "bg-amber-50 dark:bg-amber-950/40",
		text: "text-amber-700 dark:text-amber-300",
		bar: "bg-amber-500",
		border: "border-amber-200 dark:border-amber-800",
		ring: "ring-amber-500/30",
	},
	{
		bg: "bg-violet-50 dark:bg-violet-950/40",
		text: "text-violet-700 dark:text-violet-300",
		bar: "bg-violet-500",
		border: "border-violet-200 dark:border-violet-800",
		ring: "ring-violet-500/30",
	},
	{
		bg: "bg-rose-50 dark:bg-rose-950/40",
		text: "text-rose-700 dark:text-rose-300",
		bar: "bg-rose-500",
		border: "border-rose-200 dark:border-rose-800",
		ring: "ring-rose-500/30",
	},
	{
		bg: "bg-cyan-50 dark:bg-cyan-950/40",
		text: "text-cyan-700 dark:text-cyan-300",
		bar: "bg-cyan-500",
		border: "border-cyan-200 dark:border-cyan-800",
		ring: "ring-cyan-500/30",
	},
];

function getSpeakerColor(speakerIndex: number) {
	return SPEAKER_COLORS[speakerIndex % SPEAKER_COLORS.length];
}

/**
 * Compact speaker legend with talk time percentages
 */
function SpeakerLegend({
	speakers,
}: {
	speakers: {
		id: string;
		label: string;
		totalTime: number;
		percentage: number;
	}[];
}) {
	return (
		<div className="flex flex-wrap gap-3">
			{speakers.map((speaker, index) => {
				const color = getSpeakerColor(index);
				return (
					<div
						key={speaker.id}
						className={cn(
							"flex items-center gap-2 rounded-full px-3 py-1.5 text-sm",
							color.bg,
							color.border,
							"border",
						)}
					>
						<div
							className={cn("size-2.5 rounded-full", color.bar)}
						/>
						<span className={cn("font-medium", color.text)}>
							{speaker.label}
						</span>
						<span className="text-muted-foreground text-xs tabular-nums">
							{speaker.percentage.toFixed(0)}%
						</span>
					</div>
				);
			})}
		</div>
	);
}

/**
 * Timeline visualization showing speaker segments
 */
function SpeakerTimeline({
	segments,
	totalDuration,
	speakers,
	currentTime,
	onSeek,
}: {
	segments: SpeakerSegment[];
	totalDuration: number;
	speakers: string[];
	currentTime: number;
	onSeek: (time: number) => void;
}) {
	const speakerIndexMap = new Map<string, number>();
	speakers.forEach((speaker, index) => {
		speakerIndexMap.set(speaker, index);
	});

	const playheadPosition = (currentTime / totalDuration) * 100;

	return (
		<div className="space-y-3">
			<div className="relative h-10 rounded-lg bg-muted/30 overflow-hidden border border-border/50">
				{segments.map((segment, index) => {
					const speakerIndex =
						speakerIndexMap.get(segment.speaker) ?? 0;
					const color = getSpeakerColor(speakerIndex);
					const left = (segment.startTime / totalDuration) * 100;
					const width =
						((segment.endTime - segment.startTime) /
							totalDuration) *
						100;

					return (
						<button
							key={`${segment.speaker}-${segment.startTime}-${index}`}
							type="button"
							className={cn(
								"absolute top-0 h-full transition-all hover:brightness-110 cursor-pointer",
								color.bar,
							)}
							style={{
								left: `${left}%`,
								width: `${Math.max(width, 0.5)}%`,
							}}
							title={`${segment.speaker}: ${formatDuration(segment.startTime)} - ${formatDuration(segment.endTime)}`}
							onClick={() => onSeek(segment.startTime)}
						/>
					);
				})}
				{/* Playhead */}
				<div
					className="absolute top-0 h-full w-0.5 bg-foreground shadow-lg pointer-events-none z-10 transition-all duration-75"
					style={{ left: `${playheadPosition}%` }}
				>
					<div className="absolute -top-1 -left-1 size-2.5 rounded-full bg-foreground" />
				</div>
			</div>
			<div className="flex justify-between text-xs text-muted-foreground tabular-nums">
				<span>0:00</span>
				<span>{formatDuration(totalDuration)}</span>
			</div>
		</div>
	);
}

/**
 * Transcript view with clickable segments
 */
function TranscriptView({
	segments,
	speakers,
	currentTime,
	onSeek,
}: {
	segments: SpeakerSegment[];
	speakers: string[];
	currentTime: number;
	onSeek: (time: number) => void;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const activeSegmentRef = useRef<HTMLButtonElement>(null);

	const speakerIndexMap = new Map<string, number>();
	speakers.forEach((speaker, index) => {
		speakerIndexMap.set(speaker, index);
	});

	const currentSegmentIndex = segments.findIndex(
		(seg) => currentTime >= seg.startTime && currentTime < seg.endTime,
	);

	useEffect(() => {
		if (activeSegmentRef.current && containerRef.current) {
			const container = containerRef.current;
			const element = activeSegmentRef.current;
			const containerRect = container.getBoundingClientRect();
			const elementRect = element.getBoundingClientRect();

			if (
				elementRect.top < containerRect.top ||
				elementRect.bottom > containerRect.bottom
			) {
				element.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
	}, [currentSegmentIndex]);

	return (
		<div
			ref={containerRef}
			className="space-y-1 overflow-y-auto scroll-smooth"
			style={{ maxHeight: "calc(100vh - 400px)", minHeight: "300px" }}
		>
			{segments.map((segment, index) => {
				const speakerIndex = speakerIndexMap.get(segment.speaker) ?? 0;
				const color = getSpeakerColor(speakerIndex);
				const isActive = index === currentSegmentIndex;

				return (
					<button
						key={`${segment.speaker}-${segment.startTime}-${index}`}
						ref={isActive ? activeSegmentRef : null}
						type="button"
						onClick={() => onSeek(segment.startTime)}
						className={cn(
							"group flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
							isActive
								? cn("ring-2", color.ring, color.bg)
								: "hover:bg-muted/50",
						)}
					>
						<div className="shrink-0 w-20">
							<span
								className={cn(
									"inline-flex items-center gap-1.5 text-xs font-medium",
									isActive
										? color.text
										: "text-muted-foreground",
								)}
							>
								<span
									className={cn(
										"size-2 rounded-full",
										color.bar,
										!isActive && "opacity-60",
									)}
								/>
								{segment.speaker}
							</span>
							<span className="block font-mono text-[10px] text-muted-foreground/70 mt-0.5">
								{formatDuration(segment.startTime)}
							</span>
						</div>
						<p
							className={cn(
								"flex-1 text-sm leading-relaxed",
								isActive
									? "text-foreground"
									: "text-muted-foreground group-hover:text-foreground",
							)}
						>
							{segment.text}
						</p>
					</button>
				);
			})}
		</div>
	);
}

/**
 * Sticky audio player with integrated controls
 */
function AudioPlayer({
	audioUrl,
	currentTime,
	duration,
	isPlaying,
	onTimeUpdate,
	onSeek,
	onPlayPause,
}: {
	audioUrl: string;
	currentTime: number;
	duration: number;
	isPlaying: boolean;
	onTimeUpdate: (time: number) => void;
	onSeek: (time: number) => void;
	onPlayPause: () => void;
}) {
	const audioRef = useRef<HTMLAudioElement>(null);

	useEffect(() => {
		if (!audioRef.current) return;
		if (isPlaying) {
			audioRef.current.play().catch(() => {});
		} else {
			audioRef.current.pause();
		}
	}, [isPlaying]);

	useEffect(() => {
		if (
			audioRef.current &&
			Math.abs(audioRef.current.currentTime - currentTime) > 0.5
		) {
			audioRef.current.currentTime = currentTime;
		}
	}, [currentTime]);

	const handleTimeUpdate = useCallback(() => {
		if (audioRef.current) {
			onTimeUpdate(audioRef.current.currentTime);
		}
	}, [onTimeUpdate]);

	const handleSeek = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const newTime = Number.parseFloat(e.target.value);
			onSeek(newTime);
			if (audioRef.current) {
				audioRef.current.currentTime = newTime;
			}
		},
		[onSeek],
	);

	const handleEnded = useCallback(() => {
		onSeek(0);
		if (audioRef.current) {
			audioRef.current.currentTime = 0;
		}
	}, [onSeek]);

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

	return (
		<div className="rounded-xl bg-gradient-to-b from-muted/50 to-muted/30 border border-border/50 p-4">
			{/* biome-ignore lint/a11y/useMediaCaption: User uploaded audio */}
			<audio
				ref={audioRef}
				src={audioUrl}
				onTimeUpdate={handleTimeUpdate}
				onEnded={handleEnded}
				className="hidden"
			/>

			<div className="flex items-center gap-4">
				<Button
					type="button"
					variant="secondary"
					size="icon"
					onClick={onPlayPause}
					className="size-12 shrink-0 rounded-full shadow-sm"
				>
					{isPlaying ? (
						<PauseIcon className="size-5" />
					) : (
						<PlayIcon className="ml-0.5 size-5" />
					)}
					<span className="sr-only">
						{isPlaying ? "Pause" : "Play"}
					</span>
				</Button>

				<div className="flex-1 space-y-2">
					<div className="relative h-1.5 rounded-full bg-muted overflow-hidden">
						<div
							className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-75"
							style={{ width: `${progress}%` }}
						/>
						<input
							type="range"
							min={0}
							max={duration || 100}
							step={0.1}
							value={currentTime}
							onChange={handleSeek}
							className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
						/>
					</div>
					<div className="flex justify-between text-xs tabular-nums text-muted-foreground">
						<span>{formatDuration(currentTime)}</span>
						<span>{formatDuration(duration)}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Export dropdown with all options
 */
function ExportActions({
	result,
	filename,
}: {
	result: SpeakerSeparationOutput;
	filename: string;
}) {
	const [copied, setCopied] = useState(false);

	const handleCopyTranscript = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(result.transcript);
			setCopied(true);
			toast.success("Transcript copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Failed to copy transcript");
		}
	}, [result.transcript]);

	const handleDownloadJSON = useCallback(() => {
		const data = JSON.stringify(result, null, 2);
		const blob = new Blob([data], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${filename.replace(/\.[^.]+$/, "")}-speaker-separation.json`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("JSON downloaded");
	}, [result, filename]);

	const handleDownloadText = useCallback(() => {
		const blob = new Blob([result.transcript], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${filename.replace(/\.[^.]+$/, "")}-transcript.txt`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Transcript downloaded");
	}, [result.transcript, filename]);

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				onClick={handleCopyTranscript}
				className="gap-2"
			>
				{copied ? (
					<CheckCircle2 className="size-4 text-emerald-500" />
				) : (
					<CopyIcon className="size-4" />
				)}
				<span className="hidden sm:inline">Copy</span>
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={handleDownloadText}
				className="gap-2"
			>
				<FileTextIcon className="size-4" />
				<span className="hidden sm:inline">TXT</span>
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={handleDownloadJSON}
				className="gap-2"
			>
				<DownloadIcon className="size-4" />
				<span className="hidden sm:inline">JSON</span>
			</Button>
		</div>
	);
}

export function SpeakerSeparationDetail({
	jobId,
}: SpeakerSeparationDetailProps) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);

	const { data, isLoading, error } = useQuery({
		...orpc.jobs.get.queryOptions({
			input: { jobId },
		}),
		refetchInterval: (query) => {
			const job = query.state.data?.job as
				| SpeakerSeparationJob
				| undefined;
			if (job?.status === "PENDING" || job?.status === "PROCESSING") {
				return 2000;
			}
			return false;
		},
	});

	const job = data?.job as SpeakerSeparationJob | undefined;
	const result = job?.output as SpeakerSeparationOutput | null;

	// Fetch signed URL for audio playback
	useEffect(() => {
		async function fetchAudioUrl() {
			if (!job?.audioFileUrl) return;
			try {
				const response = await fetch(
					`/api/tools/speaker-separation/audio/${jobId}`,
				);
				if (response.ok) {
					const data = await response.json();
					setAudioUrl(data.url);
				}
			} catch (error) {
				console.error("Failed to fetch audio URL:", error);
			}
		}

		if (job?.status === "COMPLETED" && job?.audioFileUrl) {
			fetchAudioUrl();
		}
	}, [job?.audioFileUrl, job?.status, jobId]);

	// Re-analyze mutation
	const reanalyzeMutation = useMutation({
		mutationFn: async () => {
			if (!job) throw new Error("No job data");
			const sessionId =
				typeof window !== "undefined"
					? (localStorage.getItem("speaker-separation-session-id") ??
						undefined)
					: undefined;

			const input = job.audioFileUrl
				? {
						audioFileUrl: job.audioFileUrl,
						audioMetadata: job.audioMetadata,
					}
				: job.input;

			return orpcClient.jobs.create({
				toolSlug: "speaker-separation",
				input,
				sessionId,
			});
		},
		onSuccess: (data) => {
			toast.success("Re-analysis started");
			router.push(`/app/tools/speaker-separation/${data.job.id}`);
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
			queryClient.invalidateQueries({ queryKey: ["jobs", "list"] });
			router.push("/app/tools/speaker-separation?tab=history");
		},
		onError: (err) => {
			toast.error(
				err instanceof Error
					? err.message
					: "Failed to delete analysis",
			);
		},
	});

	const handleSeek = useCallback((time: number) => {
		setCurrentTime(time);
	}, []);

	const handlePlayPause = useCallback(() => {
		setIsPlaying((prev) => !prev);
	}, []);

	const handleTimeUpdate = useCallback((time: number) => {
		setCurrentTime(time);
	}, []);

	// Loading state
	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="flex flex-col items-center gap-3">
					<Loader2 className="size-8 animate-spin text-primary" />
					<span className="text-muted-foreground">
						Loading analysis…
					</span>
				</div>
			</div>
		);
	}

	// Error state
	if (error || !job) {
		return (
			<div className="max-w-lg mx-auto space-y-4 py-12">
				<Alert variant="error">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						{error instanceof Error
							? error.message
							: "Failed to load analysis. It may have been deleted or expired."}
					</AlertDescription>
				</Alert>
				<div className="flex justify-center">
					<Button variant="outline" asChild>
						<Link href="/app/tools/speaker-separation?tab=history">
							<ArrowLeft className="mr-2 size-4" />
							Back to History
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	const filename = getFilename(job);
	const duration = getDuration(job);

	return (
		<div className="space-y-6">
			{/* Header */}
			<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="shrink-0"
					>
						<Link href="/app/tools/speaker-separation?tab=history">
							<ArrowLeft className="size-4" />
							<span className="sr-only">Back to History</span>
						</Link>
					</Button>
					<div className="min-w-0">
						<h1 className="text-lg font-semibold truncate">
							{filename}
						</h1>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<StatusBadge status={job.status} />
							<span className="text-muted-foreground/50">·</span>
							<span className="tabular-nums">
								{formatDuration(duration)}
							</span>
							{result && (
								<>
									<span className="text-muted-foreground/50">
										·
									</span>
									<span>
										{result.speakerCount} speaker
										{result.speakerCount !== 1 ? "s" : ""}
									</span>
								</>
							)}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					{job.status === "COMPLETED" && result && (
						<ExportActions result={result} filename={filename} />
					)}

					<Button
						variant="ghost"
						size="icon"
						onClick={() => reanalyzeMutation.mutate()}
						disabled={reanalyzeMutation.isPending}
						title="Re-analyze"
					>
						{reanalyzeMutation.isPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<RefreshCw className="size-4" />
						)}
					</Button>

					<Dialog
						open={isDeleteDialogOpen}
						onOpenChange={setIsDeleteDialogOpen}
					>
						<DialogTrigger asChild>
							<Button variant="ghost" size="icon" title="Delete">
								<Trash2 className="size-4" />
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
									{deleteMutation.isPending && (
										<Loader2 className="mr-2 size-4 animate-spin" />
									)}
									Delete
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</header>

			{/* Processing State */}
			{(job.status === "PENDING" || job.status === "PROCESSING") && (
				<div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border/50 bg-muted/20">
					<Loader2 className="size-10 animate-spin text-primary mb-4" />
					<p className="font-medium">
						{job.status === "PENDING"
							? "Analysis queued…"
							: "Analyzing audio…"}
					</p>
					<p className="text-sm text-muted-foreground mt-1">
						This may take a few minutes for longer audio files
					</p>
				</div>
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

			{/* Results - Two Column Layout */}
			{job.status === "COMPLETED" && result && (
				<div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
					{/* Left Column - Audio & Timeline */}
					<div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
						{/* Audio Player */}
						{audioUrl && (
							<AudioPlayer
								audioUrl={audioUrl}
								currentTime={currentTime}
								duration={result.duration}
								isPlaying={isPlaying}
								onTimeUpdate={handleTimeUpdate}
								onSeek={handleSeek}
								onPlayPause={handlePlayPause}
							/>
						)}

						{/* Timeline */}
						<div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
							<h2 className="text-sm font-medium text-muted-foreground">
								Timeline
							</h2>
							<SpeakerTimeline
								segments={result.segments}
								totalDuration={result.duration}
								speakers={result.speakers.map((s) => s.label)}
								currentTime={currentTime}
								onSeek={handleSeek}
							/>
						</div>

						{/* Speaker Legend */}
						<div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
							<h2 className="text-sm font-medium text-muted-foreground">
								Speakers
							</h2>
							<SpeakerLegend speakers={result.speakers} />
						</div>

						{/* Metadata */}
						<div className="rounded-xl border border-border/50 bg-card p-4">
							<dl className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<dt className="text-muted-foreground">
										Duration
									</dt>
									<dd className="font-medium tabular-nums">
										{formatDuration(duration)}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">
										Segments
									</dt>
									<dd className="font-medium tabular-nums">
										{result.segments.length}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">
										Processing
									</dt>
									<dd className="font-medium tabular-nums">
										{formatProcessingDuration(
											job.startedAt,
											job.completedAt,
										)}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">
										Completed
									</dt>
									<dd className="font-medium">
										{job.completedAt
											? new Date(
													job.completedAt,
												).toLocaleTimeString()
											: "—"}
									</dd>
								</div>
							</dl>
						</div>
					</div>

					{/* Right Column - Transcript */}
					<div className="rounded-xl border border-border/50 bg-card overflow-hidden">
						<div className="border-b border-border/50 px-4 py-3 bg-muted/30">
							<h2 className="text-sm font-medium">
								Transcript
								<span className="ml-2 text-muted-foreground font-normal">
									{result.segments.length} segments
								</span>
							</h2>
						</div>
						<div className="p-2">
							<TranscriptView
								segments={result.segments}
								speakers={result.speakers.map((s) => s.label)}
								currentTime={currentTime}
								onSeek={handleSeek}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
