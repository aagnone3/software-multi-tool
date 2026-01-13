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
import { Input } from "@ui/components/input";
import { cn } from "@ui/lib";
import {
	ArrowRightIcon,
	CheckCircle2Icon,
	ClockIcon,
	MicIcon,
	RefreshCwIcon,
	UsersIcon,
} from "lucide-react";
import React, { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { useCreateJob } from "../hooks/use-job-polling";
import { AudioFileUpload, type AudioFileData } from "./AudioFileUpload";
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
	maxSpeakers: z.coerce.number().min(2).max(20).optional(),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * Speaker segment in the diarization output.
 */
interface SpeakerSegment {
	speaker: string;
	start: number;
	end: number;
	confidence: number;
}

/**
 * Speaker statistics in the output.
 */
interface SpeakerStats {
	speaker: string;
	totalDuration: number;
	segmentCount: number;
	percentageOfTotal: number;
}

/**
 * Diarization output structure.
 */
interface DiarizationOutput {
	segments: SpeakerSegment[];
	speakers: SpeakerStats[];
	totalDuration: number;
	totalSpeakers: number;
	confidence: number;
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
 * Format timestamp range.
 */
function formatTimeRange(start: number, end: number): string {
	return `${formatDuration(start)} - ${formatDuration(end)}`;
}

/**
 * Get a color for a speaker based on their index.
 */
function getSpeakerColor(speakerIndex: number): {
	bg: string;
	text: string;
	bar: string;
} {
	const colors = [
		{
			bg: "bg-blue-100 dark:bg-blue-900/30",
			text: "text-blue-700 dark:text-blue-300",
			bar: "bg-blue-500",
		},
		{
			bg: "bg-emerald-100 dark:bg-emerald-900/30",
			text: "text-emerald-700 dark:text-emerald-300",
			bar: "bg-emerald-500",
		},
		{
			bg: "bg-amber-100 dark:bg-amber-900/30",
			text: "text-amber-700 dark:text-amber-300",
			bar: "bg-amber-500",
		},
		{
			bg: "bg-purple-100 dark:bg-purple-900/30",
			text: "text-purple-700 dark:text-purple-300",
			bar: "bg-purple-500",
		},
		{
			bg: "bg-pink-100 dark:bg-pink-900/30",
			text: "text-pink-700 dark:text-pink-300",
			bar: "bg-pink-500",
		},
		{
			bg: "bg-cyan-100 dark:bg-cyan-900/30",
			text: "text-cyan-700 dark:text-cyan-300",
			bar: "bg-cyan-500",
		},
		{
			bg: "bg-orange-100 dark:bg-orange-900/30",
			text: "text-orange-700 dark:text-orange-300",
			bar: "bg-orange-500",
		},
		{
			bg: "bg-indigo-100 dark:bg-indigo-900/30",
			text: "text-indigo-700 dark:text-indigo-300",
			bar: "bg-indigo-500",
		},
	];
	return colors[speakerIndex % colors.length];
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
	const percentage = Math.round(confidence * 100);
	const getStatus = () => {
		if (percentage >= 80) {
			return { color: "bg-emerald-500", label: "High" };
		}
		if (percentage >= 50) {
			return { color: "bg-amber-500", label: "Medium" };
		}
		return { color: "bg-red-500", label: "Low" };
	};
	const status = getStatus();

	return (
		<div className="flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1.5">
			<div className={cn("size-2 rounded-full", status.color)} />
			<span className="font-medium text-sm">{percentage}%</span>
			<span className="text-muted-foreground text-xs">
				{status.label} confidence
			</span>
		</div>
	);
}

/**
 * Timeline visualization showing speaker segments.
 */
function SpeakerTimeline({
	segments,
	totalDuration,
	speakers,
}: {
	segments: SpeakerSegment[];
	totalDuration: number;
	speakers: string[];
}) {
	// Create a map of speaker to index
	const speakerIndexMap = new Map<string, number>();
	speakers.forEach((speaker, index) => {
		speakerIndexMap.set(speaker, index);
	});

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
					const left = (segment.start / totalDuration) * 100;
					const width =
						((segment.end - segment.start) / totalDuration) * 100;

					return (
						<div
							key={index}
							className={cn(
								"absolute top-0 h-full transition-opacity hover:opacity-80",
								color.bar,
							)}
							style={{
								left: `${left}%`,
								width: `${Math.max(width, 0.5)}%`,
							}}
							title={`${segment.speaker}: ${formatTimeRange(segment.start, segment.end)}`}
						/>
					);
				})}
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

export function SpeakerDiarizationTool() {
	const [jobId, setJobId] = useState<string | null>(null);
	const [result, setResult] = useState<DiarizationOutput | null>(null);
	const createJobMutation = useCreateJob();

	const form = useForm<FormValues>({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			audioFile: null,
			maxSpeakers: undefined,
		},
	});

	const onSubmit: SubmitHandler<FormValues> = async (values) => {
		setResult(null);
		if (!values.audioFile) {
			return;
		}
		try {
			const response = await createJobMutation.mutateAsync({
				toolSlug: "diarization",
				input: values,
			});
			setJobId(response.job.id);
		} catch (error) {
			console.error("Failed to create job:", error);
		}
	};

	const handleComplete = (output: Record<string, unknown>) => {
		setResult(output as unknown as DiarizationOutput);
	};

	const handleNewAnalysis = () => {
		setJobId(null);
		setResult(null);
		form.reset();
	};

	const handleFileSelected = (fileData: AudioFileData) => {
		form.setValue("audioFile", fileData, { shouldValidate: true });
	};

	const handleFileClear = () => {
		form.setValue("audioFile", null, { shouldValidate: true });
	};

	const selectedFile = form.watch("audioFile");

	return (
		<div className="mx-auto max-w-4xl space-y-8">
			{!jobId && (
				<Card className="overflow-hidden border-0 shadow-lg">
					<div className="bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent p-6 pb-0">
						<div className="flex items-start gap-4">
							<div className="flex size-14 items-center justify-center rounded-2xl bg-cyan-500 shadow-lg shadow-cyan-500/25">
								<UsersIcon className="size-7 text-white" />
							</div>
							<div className="flex-1">
								<h2 className="font-bold text-2xl tracking-tight">
									Speaker Diarization
								</h2>
								<p className="mt-1 text-muted-foreground">
									Analyze audio to identify different speakers
									and visualize speaking patterns
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
												<MicIcon className="size-4 text-cyan-500" />
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
												M4A, OGG, WEBM) up to 100MB.
												Preview your audio before
												processing.
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="maxSpeakers"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="font-semibold text-base">
												Maximum Speakers (Optional)
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													placeholder="Auto-detect"
													min={2}
													max={20}
													className="rounded-xl border-2 bg-muted/30 transition-colors focus:border-cyan-500 focus:bg-background"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormDescription className="text-muted-foreground/80">
												Optionally specify the maximum
												number of speakers to detect
												(2-20). Leave empty for
												auto-detection.
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
									className="h-12 w-full rounded-xl bg-cyan-500 font-semibold text-base shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-600 hover:shadow-xl hover:shadow-cyan-500/30"
								>
									<UsersIcon className="mr-2 size-5" />
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
					description="AI is identifying speakers in your audio..."
					onComplete={handleComplete}
				/>
			)}

			{result && (
				<div className="space-y-6">
					{/* Success Header */}
					<Card className="overflow-hidden border-0 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent shadow-lg">
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-4">
									<div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/20">
										<CheckCircle2Icon className="size-6 text-emerald-600" />
									</div>
									<div>
										<h3 className="font-bold text-xl">
											Analysis Complete
										</h3>
										<p className="text-muted-foreground">
											{result.totalSpeakers} speaker
											{result.totalSpeakers !== 1
												? "s"
												: ""}{" "}
											identified in{" "}
											{formatDuration(
												result.totalDuration,
											)}
										</p>
									</div>
								</div>
								<ConfidenceBadge
									confidence={result.confidence}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Speaker Timeline */}
					<Card className="border-0 shadow-md">
						<CardContent className="p-6">
							<h4 className="mb-4 flex items-center gap-2 font-semibold">
								<ClockIcon className="size-5 text-cyan-500" />
								Speaker Timeline
							</h4>
							<SpeakerTimeline
								segments={result.segments}
								totalDuration={result.totalDuration}
								speakers={result.speakers.map((s) => s.speaker)}
							/>
						</CardContent>
					</Card>

					{/* Speaker Statistics */}
					<Card className="border-0 shadow-md">
						<CardContent className="p-6">
							<h4 className="mb-4 flex items-center gap-2 font-semibold">
								<UsersIcon className="size-5 text-cyan-500" />
								Speaker Statistics
							</h4>
							<div className="space-y-4">
								{result.speakers.map((speaker, index) => {
									const color = getSpeakerColor(index);
									return (
										<div
											key={speaker.speaker}
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
													{speaker.speaker}
												</span>
												<span className="text-muted-foreground text-sm">
													{speaker.percentageOfTotal.toFixed(
														1,
													)}
													% of audio
												</span>
											</div>
											<div className="flex items-center gap-4 text-sm text-muted-foreground">
												<span>
													Duration:{" "}
													{formatDuration(
														speaker.totalDuration,
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
														width: `${speaker.percentageOfTotal}%`,
													}}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>

					{/* Segment List */}
					<Card className="border-0 shadow-md">
						<CardContent className="p-6">
							<h4 className="mb-4 font-semibold">
								Speaker Segments ({result.segments.length})
							</h4>
							<div className="max-h-96 overflow-y-auto space-y-2">
								{result.segments.map((segment, index) => {
									const speakerIndex =
										result.speakers.findIndex(
											(s) =>
												s.speaker === segment.speaker,
										);
									const color = getSpeakerColor(speakerIndex);
									return (
										<div
											key={index}
											className={cn(
												"flex items-center gap-3 rounded-lg p-3",
												color.bg,
											)}
										>
											<span
												className={cn(
													"w-24 shrink-0 font-medium",
													color.text,
												)}
											>
												{segment.speaker}
											</span>
											<span className="font-mono text-muted-foreground text-sm">
												{formatTimeRange(
													segment.start,
													segment.end,
												)}
											</span>
											<span className="ml-auto text-muted-foreground text-xs">
												{(
													segment.end - segment.start
												).toFixed(1)}
												s
											</span>
										</div>
									);
								})}
							</div>
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
