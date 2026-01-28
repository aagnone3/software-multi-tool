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
import { cn } from "@ui/lib";
import {
	AlertCircle,
	ArrowLeft,
	AudioLines,
	CheckCircle2,
	Clock,
	ClockIcon,
	CopyIcon,
	DownloadIcon,
	FileText,
	FileTextIcon,
	Loader2,
	PauseIcon,
	PlayIcon,
	RefreshCw,
	Timer,
	Trash2,
	Users,
	UsersIcon,
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
import type { SpeakerSegment, SpeakerSeparationOutput } from "./lib/types";

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
 * Get a color for a speaker based on their index.
 */
function getSpeakerColor(speakerIndex: number): {
	bg: string;
	text: string;
	bar: string;
	border: string;
} {
	const colors = [
		{
			bg: "bg-blue-100 dark:bg-blue-900/30",
			text: "text-blue-700 dark:text-blue-300",
			bar: "bg-blue-500",
			border: "border-blue-300 dark:border-blue-700",
		},
		{
			bg: "bg-emerald-100 dark:bg-emerald-900/30",
			text: "text-emerald-700 dark:text-emerald-300",
			bar: "bg-emerald-500",
			border: "border-emerald-300 dark:border-emerald-700",
		},
		{
			bg: "bg-amber-100 dark:bg-amber-900/30",
			text: "text-amber-700 dark:text-amber-300",
			bar: "bg-amber-500",
			border: "border-amber-300 dark:border-amber-700",
		},
		{
			bg: "bg-purple-100 dark:bg-purple-900/30",
			text: "text-purple-700 dark:text-purple-300",
			bar: "bg-purple-500",
			border: "border-purple-300 dark:border-purple-700",
		},
		{
			bg: "bg-pink-100 dark:bg-pink-900/30",
			text: "text-pink-700 dark:text-pink-300",
			bar: "bg-pink-500",
			border: "border-pink-300 dark:border-pink-700",
		},
		{
			bg: "bg-cyan-100 dark:bg-cyan-900/30",
			text: "text-cyan-700 dark:text-cyan-300",
			bar: "bg-cyan-500",
			border: "border-cyan-300 dark:border-cyan-700",
		},
		{
			bg: "bg-orange-100 dark:bg-orange-900/30",
			text: "text-orange-700 dark:text-orange-300",
			bar: "bg-orange-500",
			border: "border-orange-300 dark:border-orange-700",
		},
		{
			bg: "bg-indigo-100 dark:bg-indigo-900/30",
			text: "text-indigo-700 dark:text-indigo-300",
			bar: "bg-indigo-500",
			border: "border-indigo-300 dark:border-indigo-700",
		},
	];
	return colors[speakerIndex % colors.length];
}

/**
 * Timeline visualization showing speaker segments.
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
		<div className="space-y-2">
			<div className="flex items-center justify-between text-muted-foreground text-xs">
				<span>0:00</span>
				<span>{formatDuration(totalDuration)}</span>
			</div>
			<div className="relative h-12 rounded-lg bg-muted/50 overflow-hidden">
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
								"absolute top-0 h-full transition-opacity hover:opacity-80 cursor-pointer",
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
				<div
					className="absolute top-0 h-full w-0.5 bg-foreground/80 pointer-events-none z-10 transition-all"
					style={{ left: `${playheadPosition}%` }}
				/>
			</div>
			<div className="flex flex-wrap gap-3 mt-2">
				{speakers.map((speaker, index) => {
					const color = getSpeakerColor(index);
					return (
						<div
							key={speaker}
							className="flex items-center gap-1.5 text-xs"
						>
							<div className={cn("size-3 rounded", color.bar)} />
							<span className="text-muted-foreground">
								{speaker}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

/**
 * Transcript view with clickable segments.
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
			className="max-h-96 overflow-y-auto space-y-2 scroll-smooth"
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
							"flex w-full gap-3 rounded-lg p-3 text-left transition-all",
							isActive
								? cn(
										"ring-2 ring-offset-2",
										color.bg,
										color.border,
									)
								: cn(
										"hover:bg-muted/50",
										color.bg,
										"opacity-70 hover:opacity-100",
									),
						)}
					>
						<div className="shrink-0 space-y-1">
							<span
								className={cn(
									"block font-semibold text-sm",
									color.text,
								)}
							>
								{segment.speaker}
							</span>
							<span className="block font-mono text-muted-foreground text-xs">
								{formatDuration(segment.startTime)}
							</span>
						</div>
						<p className="flex-1 text-sm leading-relaxed">
							{segment.text}
						</p>
					</button>
				);
			})}
		</div>
	);
}

/**
 * Audio player that loads from a URL (storage) or base64.
 */
function AudioPlayerFromUrl({
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
		if (!audioRef.current) {
			return;
		}

		if (isPlaying) {
			audioRef.current.play().catch(() => {
				// Handle autoplay restrictions
			});
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

	return (
		<div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
			{/* biome-ignore lint/a11y/useMediaCaption: User uploaded audio */}
			<audio
				ref={audioRef}
				src={audioUrl}
				onTimeUpdate={handleTimeUpdate}
				onEnded={handleEnded}
				className="hidden"
			/>

			<Button
				type="button"
				variant="secondary"
				size="icon"
				onClick={onPlayPause}
				className="size-12 shrink-0 rounded-full"
			>
				{isPlaying ? (
					<PauseIcon className="size-6" />
				) : (
					<PlayIcon className="ml-0.5 size-6" />
				)}
				<span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
			</Button>

			<div className="flex flex-1 items-center gap-2">
				<span className="w-14 text-right font-mono text-muted-foreground text-sm">
					{formatDuration(currentTime)}
				</span>
				<input
					type="range"
					min={0}
					max={duration || 100}
					step={0.1}
					value={currentTime}
					onChange={handleSeek}
					className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-muted [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
				/>
				<span className="w-14 font-mono text-muted-foreground text-sm">
					{formatDuration(duration)}
				</span>
			</div>
		</div>
	);
}

/**
 * Export options component.
 */
function ExportOptions({
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
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard API not available
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
	}, [result, filename]);

	const handleDownloadText = useCallback(() => {
		const blob = new Blob([result.transcript], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${filename.replace(/\.[^.]+$/, "")}-transcript.txt`;
		a.click();
		URL.revokeObjectURL(url);
	}, [result.transcript, filename]);

	return (
		<div className="flex flex-wrap gap-2">
			<Button variant="outline" size="sm" onClick={handleCopyTranscript}>
				{copied ? (
					<>
						<CheckCircle2 className="mr-2 size-4" />
						Copied!
					</>
				) : (
					<>
						<CopyIcon className="mr-2 size-4" />
						Copy Transcript
					</>
				)}
			</Button>
			<Button variant="outline" size="sm" onClick={handleDownloadText}>
				<FileTextIcon className="mr-2 size-4" />
				Download TXT
			</Button>
			<Button variant="outline" size="sm" onClick={handleDownloadJSON}>
				<DownloadIcon className="mr-2 size-4" />
				Download JSON
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

	// Fetch signed URL for audio playback when job is available
	useEffect(() => {
		async function fetchAudioUrl() {
			if (!job?.audioFileUrl) return;

			try {
				// Call the audio download URL API
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

			// Re-create job with same input
			// If audio is in storage, use audioFileUrl; otherwise use original input
			const input = job.audioFileUrl
				? {
						audioFileUrl: job.audioFileUrl,
						audioMetadata: job.audioMetadata,
					}
				: job.input;

			const response = await orpcClient.jobs.create({
				toolSlug: "speaker-separation",
				input,
				sessionId,
			});

			return response;
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
						<Link href="/app/tools/speaker-separation?tab=history">
							<ArrowLeft className="mr-2 size-4" />
							Back to History
						</Link>
					</Button>
				</div>
			</Card>
		);
	}

	const filename = getFilename(job);
	const duration = getDuration(job);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<Button variant="ghost" asChild>
					<Link href="/app/tools/speaker-separation?tab=history">
						<ArrowLeft className="mr-2 size-4" />
						Back to History
					</Link>
				</Button>

				<div className="flex items-center gap-2">
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
						<CardTitle className="flex items-center gap-2">
							<AudioLines className="size-5 text-violet-500" />
							{filename}
						</CardTitle>
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
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div>
							<p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
								<Clock className="size-3.5" />
								Duration
							</p>
							<p className="text-sm">
								{formatDuration(duration)}
							</p>
						</div>
						{result && (
							<div>
								<p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
									<Users className="size-3.5" />
									Speakers
								</p>
								<p className="text-sm">{result.speakerCount}</p>
							</div>
						)}
						<div>
							<p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
								<Timer className="size-3.5" />
								Processing Time
							</p>
							<p className="text-sm">
								{formatProcessingDuration(
									job.startedAt,
									job.completedAt,
								)}
							</p>
						</div>
						{job.completedAt && (
							<div>
								<p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
									<CheckCircle2 className="size-3.5" />
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
								: "Analyzing audio..."}
						</p>
						<p className="text-sm text-muted-foreground mt-2">
							This may take a few minutes for longer audio files
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

			{/* Results */}
			{job.status === "COMPLETED" && result && (
				<div className="space-y-6">
					{/* Export Options */}
					<Card className="border-0 shadow-md">
						<CardContent className="p-6">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-4">
									<div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20">
										<CheckCircle2 className="size-6 text-emerald-600" />
									</div>
									<div>
										<h3 className="font-bold text-xl">
											Analysis Complete
										</h3>
										<p className="text-muted-foreground">
											{result.speakerCount} speaker
											{result.speakerCount !== 1
												? "s"
												: ""}{" "}
											identified
										</p>
									</div>
								</div>
								<ExportOptions
									result={result}
									filename={filename}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Audio Player */}
					{audioUrl && (
						<Card className="border-0 shadow-md">
							<CardContent className="p-6">
								<AudioPlayerFromUrl
									audioUrl={audioUrl}
									currentTime={currentTime}
									duration={result.duration}
									isPlaying={isPlaying}
									onTimeUpdate={handleTimeUpdate}
									onSeek={handleSeek}
									onPlayPause={handlePlayPause}
								/>
							</CardContent>
						</Card>
					)}

					{/* Speaker Timeline */}
					<Card className="border-0 shadow-md">
						<CardContent className="p-6">
							<h4 className="mb-4 flex items-center gap-2 font-semibold">
								<ClockIcon className="size-5 text-violet-500" />
								Speaker Timeline
							</h4>
							<SpeakerTimeline
								segments={result.segments}
								totalDuration={result.duration}
								speakers={result.speakers.map((s) => s.label)}
								currentTime={currentTime}
								onSeek={handleSeek}
							/>
						</CardContent>
					</Card>

					{/* Speaker Statistics */}
					<Card className="border-0 shadow-md">
						<CardContent className="p-6">
							<h4 className="mb-4 flex items-center gap-2 font-semibold">
								<UsersIcon className="size-5 text-violet-500" />
								Speaker Statistics
							</h4>
							<div className="grid gap-4 sm:grid-cols-2">
								{result.speakers.map((speaker, index) => {
									const color = getSpeakerColor(index);
									return (
										<div
											key={speaker.id}
											className={cn(
												"rounded-xl p-4",
												color.bg,
											)}
										>
											<div className="flex items-center justify-between mb-2">
												<span
													className={cn(
														"font-semibold",
														color.text,
													)}
												>
													{speaker.label}
												</span>
												<span className="text-muted-foreground text-sm">
													{speaker.percentage.toFixed(
														1,
													)}
													%
												</span>
											</div>
											<div className="flex items-center gap-4 text-sm text-muted-foreground">
												<span>
													Duration:{" "}
													{formatDuration(
														speaker.totalTime,
													)}
												</span>
												<span>
													Segments:{" "}
													{speaker.segmentCount}
												</span>
											</div>
											<div className="mt-2 h-2 rounded-full bg-muted/50 overflow-hidden">
												<div
													className={cn(
														"h-full rounded-full",
														color.bar,
													)}
													style={{
														width: `${speaker.percentage}%`,
													}}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* Transcript */}
					<Card className="border-0 shadow-md">
						<CardContent className="p-6">
							<h4 className="mb-4 flex items-center gap-2 font-semibold">
								<FileText className="size-5 text-violet-500" />
								Transcript ({result.segments.length} segments)
							</h4>
							<TranscriptView
								segments={result.segments}
								speakers={result.speakers.map((s) => s.label)}
								currentTime={currentTime}
								onSeek={handleSeek}
							/>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
