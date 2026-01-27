"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { cn } from "@ui/lib";
import {
	ArrowRightIcon,
	AudioLinesIcon,
	CheckCircle2Icon,
	ClockIcon,
	CopyIcon,
	DownloadIcon,
	FileTextIcon,
	MicIcon,
	PauseIcon,
	PlayIcon,
	RefreshCwIcon,
	UsersIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateJob } from "../hooks/use-job-polling";
import { type AudioFileData, AudioFileUpload } from "./AudioFileUpload";
import { JobProgressIndicator } from "./JobProgressIndicator";

/** Schema for audio file data in form. */
const audioFileSchema = z.object({
	content: z.string().min(1),
	mimeType: z.string(),
	filename: z.string(),
	duration: z.number().optional(),
});

const formSchema = z.object({
	audioFile: audioFileSchema.nullable(),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Speaker segment from the speaker separation output.
 */
interface SpeakerSegment {
	speaker: string;
	text: string;
	startTime: number;
	endTime: number;
	confidence: number;
}

/**
 * Per-speaker statistics.
 */
interface SpeakerStats {
	id: string;
	label: string;
	totalTime: number;
	percentage: number;
	segmentCount: number;
}

/**
 * Speaker separation output structure.
 */
interface SpeakerSeparationOutput {
	speakerCount: number;
	duration: number;
	speakers: SpeakerStats[];
	segments: SpeakerSegment[];
	transcript: string;
}

/**
 * Format duration in seconds to MM:SS or HH:MM:SS.
 */
function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}
	return `${minutes}:${secs.toString().padStart(2, "0")}`;
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
 * Timeline visualization showing speaker segments with transcripts.
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

	// Calculate playhead position
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
				{/* Playhead */}
				<div
					className="absolute top-0 h-full w-0.5 bg-foreground/80 pointer-events-none z-10 transition-all"
					style={{ left: `${playheadPosition}%` }}
				/>
			</div>
			{/* Legend */}
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
 * Transcript view with clickable segments that sync with audio.
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

	// Find current segment
	const currentSegmentIndex = segments.findIndex(
		(seg) => currentTime >= seg.startTime && currentTime < seg.endTime,
	);

	// Auto-scroll to active segment
	useEffect(() => {
		if (activeSegmentRef.current && containerRef.current) {
			const container = containerRef.current;
			const element = activeSegmentRef.current;
			const containerRect = container.getBoundingClientRect();
			const elementRect = element.getBoundingClientRect();

			// Check if element is outside visible area
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
 * Audio player with playback controls.
 */
function AudioPlayer({
	audioData,
	currentTime,
	duration,
	isPlaying,
	onTimeUpdate,
	onSeek,
	onPlayPause,
}: {
	audioData: AudioFileData;
	currentTime: number;
	duration: number;
	isPlaying: boolean;
	onTimeUpdate: (time: number) => void;
	onSeek: (time: number) => void;
	onPlayPause: () => void;
}) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);

	// Create audio URL from base64
	useEffect(() => {
		const blob = new Blob(
			[Uint8Array.from(atob(audioData.content), (c) => c.charCodeAt(0))],
			{ type: audioData.mimeType },
		);
		const url = URL.createObjectURL(blob);
		setAudioUrl(url);

		return () => {
			URL.revokeObjectURL(url);
		};
	}, [audioData.content, audioData.mimeType]);

	// Handle play/pause
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

	// Handle seek from external source
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

	if (!audioUrl) {
		return null;
	}

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
						<CheckCircle2Icon className="mr-2 size-4" />
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

export function SpeakerSeparationTool() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<SpeakerSeparationOutput | null>(null);
	const [audioFile, setAudioFile] = useState<AudioFileData | null>(null);
	const [currentTime, setCurrentTime] = useState(0);
	const [isPlaying, setIsPlaying] = useState(false);
	const [_jobError, setJobError] = useState<string | null>(null);
	const createJobMutation = useCreateJob();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			audioFile: null,
		},
	});

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		setResult(null);
		setJobError(null);
		if (!values.audioFile) {
			return;
		}

		try {
			const response = await createJobMutation.mutateAsync({
				toolSlug: "speaker-separation",
				input: values,
			});

			setJobId(response.job.id);
			setAudioFile(values.audioFile);
		} catch (error) {
			console.error("Failed to create job:", error);
			setJobError(
				error instanceof Error ? error.message : "Failed to create job",
			);
		}
	};

	const handleComplete = (output: Record<string, unknown>) => {
		setResult(output as unknown as SpeakerSeparationOutput);
	};

	const handleError = (error: string) => {
		setJobError(error);
	};

	const handleNewAnalysis = () => {
		setJobId(null);
		setResult(null);
		setAudioFile(null);
		setCurrentTime(0);
		setIsPlaying(false);
		form.reset();
	};

	const handleFileSelected = (fileData: AudioFileData) => {
		form.setValue("audioFile", fileData, { shouldValidate: true });
	};

	const handleFileClear = () => {
		form.setValue("audioFile", null, { shouldValidate: true });
	};

	const handleSeek = useCallback((time: number) => {
		setCurrentTime(time);
	}, []);

	const handlePlayPause = useCallback(() => {
		setIsPlaying((prev) => !prev);
	}, []);

	const handleTimeUpdate = useCallback((time: number) => {
		setCurrentTime(time);
	}, []);

	const selectedFile = form.watch("audioFile");

	return (
		<div className="mx-auto max-w-4xl space-y-8">
			{!jobId && (
				<Card className="overflow-hidden border-0 shadow-lg">
					<div className="bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-transparent p-6 pb-0">
						<div className="flex items-start gap-4">
							<div className="flex size-14 items-center justify-center rounded-2xl bg-violet-500 shadow-lg shadow-violet-500/25">
								<AudioLinesIcon className="size-7 text-white" />
							</div>
							<div className="flex-1">
								<h2 className="font-bold text-2xl tracking-tight">
									Speaker Separation
								</h2>
								<p className="mt-1 text-muted-foreground">
									Analyze audio to identify different speakers
									with transcripts and timestamps
								</p>
							</div>
						</div>
					</div>
					<CardContent className="p-6 pt-8">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6"
							>
								<FormField
									control={form.control}
									name="audioFile"
									render={() => (
										<FormItem>
											<FormLabel className="flex items-center gap-2 font-semibold text-base">
												<MicIcon className="size-4 text-violet-500" />
												Audio File
											</FormLabel>
											<FormControl>
												<AudioFileUpload
													onFileSelected={
														handleFileSelected
													}
													onFileClear={
														handleFileClear
													}
													selectedFile={selectedFile}
													disabled={
														form.formState
															.isSubmitting
													}
												/>
											</FormControl>
											<FormDescription className="text-muted-foreground/80">
												Upload an audio file (MP3, WAV,
												M4A, FLAC, OGG, WebM) up to
												100MB. Maximum duration: 60
												minutes.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button
									type="submit"
									variant="primary"
									loading={form.formState.isSubmitting}
									disabled={!selectedFile}
									className="h-12 w-full rounded-xl bg-violet-500 font-semibold text-base shadow-lg shadow-violet-500/25 transition-all hover:bg-violet-600 hover:shadow-xl hover:shadow-violet-500/30"
								>
									<AudioLinesIcon className="mr-2 size-5" />
									Analyze Speakers
									<ArrowRightIcon className="ml-2 size-5" />
								</Button>
							</form>
						</Form>
					</CardContent>
				</Card>
			)}

			{jobId && !result && (
				<JobProgressIndicator
					jobId={jobId}
					title="Analyzing Audio"
					description="AI is identifying speakers and transcribing your audio..."
					onComplete={handleComplete}
					onError={handleError}
				/>
			)}

			{result && audioFile && (
				<div className="space-y-6">
					{/* Success Header */}
					<Card className="overflow-hidden border-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent shadow-lg">
						<CardContent className="p-6">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex items-center gap-4">
									<div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20">
										<CheckCircle2Icon className="size-6 text-emerald-600" />
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
											identified in{" "}
											{formatDuration(result.duration)}
										</p>
									</div>
								</div>
								<ExportOptions
									result={result}
									filename={audioFile.filename}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Audio Player */}
					<Card className="border-0 shadow-md">
						<CardContent className="p-6">
							<AudioPlayer
								audioData={audioFile}
								currentTime={currentTime}
								duration={result.duration}
								isPlaying={isPlaying}
								onTimeUpdate={handleTimeUpdate}
								onSeek={handleSeek}
								onPlayPause={handlePlayPause}
							/>
						</CardContent>
					</Card>

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
											{/* Progress bar */}
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
								<FileTextIcon className="size-5 text-violet-500" />
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

					{/* Action Button */}
					<div className="flex justify-center pt-2">
						<Button
							onClick={handleNewAnalysis}
							variant="outline"
							className="h-11 rounded-xl px-6"
						>
							<RefreshCwIcon className="mr-2 size-4" />
							Analyze Another Audio
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
