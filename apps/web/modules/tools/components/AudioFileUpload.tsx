"use client";

import { Alert, AlertDescription } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import {
	AlertCircleIcon,
	CheckCircleIcon,
	Loader2Icon,
	Music2Icon,
	PauseIcon,
	PlayIcon,
	UploadCloudIcon,
	XIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

/**
 * Maximum file size for audio files (100MB).
 * Audio files can be large, especially for longer recordings.
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Supported audio MIME types and their display names.
 */
const SUPPORTED_TYPES = {
	"audio/mpeg": { label: "MP3", extension: ".mp3" },
	"audio/wav": { label: "WAV", extension: ".wav" },
	"audio/x-wav": { label: "WAV", extension: ".wav" },
	"audio/mp4": { label: "M4A", extension: ".m4a" },
	"audio/x-m4a": { label: "M4A", extension: ".m4a" },
	"audio/ogg": { label: "OGG", extension: ".ogg" },
	"audio/webm": { label: "WEBM", extension: ".webm" },
} as const;

/**
 * Supported file extensions for the file input accept attribute.
 */
const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".m4a", ".ogg", ".webm"];

/**
 * File data structure returned by the component.
 */
export interface AudioFileData {
	content: string; // base64 encoded
	mimeType: string;
	filename: string;
	duration?: number; // duration in seconds, if available
}

interface AudioFileUploadProps {
	/**
	 * Callback when a file is successfully selected and read.
	 */
	onFileSelected: (fileData: AudioFileData) => void;
	/**
	 * Callback when the selected file is cleared.
	 */
	onFileClear: () => void;
	/**
	 * Current file data (for controlled component behavior).
	 */
	selectedFile?: AudioFileData | null;
	/**
	 * Whether the component is disabled.
	 */
	disabled?: boolean;
	/**
	 * Custom class name for the container.
	 */
	className?: string;
}

/**
 * Format bytes to human-readable string.
 */
function formatBytes(bytes: number): string {
	if (bytes === 0) {
		return "0 Bytes";
	}
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
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
 * Get MIME type from file extension.
 */
function getMimeTypeFromExtension(filename: string): string | null {
	const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
	for (const [mimeType, info] of Object.entries(SUPPORTED_TYPES)) {
		if (info.extension === ext) {
			return mimeType;
		}
	}
	return null;
}

/**
 * Validate file type and size.
 */
function validateFile(file: File): { valid: boolean; error?: string } {
	// Check file size
	if (file.size > MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `File size (${formatBytes(file.size)}) exceeds maximum allowed (${formatBytes(MAX_FILE_SIZE)})`,
		};
	}

	// Check file type by MIME type
	if (file.type && file.type in SUPPORTED_TYPES) {
		return { valid: true };
	}

	// Fall back to extension check
	const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
	if (SUPPORTED_EXTENSIONS.includes(ext)) {
		return { valid: true };
	}

	return {
		valid: false,
		error: `Unsupported file type. Please upload an audio file (${SUPPORTED_EXTENSIONS.join(", ")})`,
	};
}

/**
 * Read file as base64 string.
 */
function readFileAsBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			// Remove the data URL prefix (e.g., "data:audio/mpeg;base64,")
			const base64 = result.split(",")[1];
			resolve(base64);
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

/**
 * Get audio duration from file.
 */
function getAudioDuration(file: File): Promise<number> {
	return new Promise((resolve, reject) => {
		const audio = new Audio();
		const objectUrl = URL.createObjectURL(file);

		audio.addEventListener("loadedmetadata", () => {
			URL.revokeObjectURL(objectUrl);
			resolve(audio.duration);
		});

		audio.addEventListener("error", () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error("Failed to load audio metadata"));
		});

		audio.src = objectUrl;
	});
}

/**
 * Audio file upload component with drag-and-drop support and audio preview.
 * Accepts MP3, WAV, M4A, OGG, and WEBM files up to 100MB.
 */
export function AudioFileUpload({
	onFileSelected,
	onFileClear,
	selectedFile,
	disabled = false,
	className,
}: AudioFileUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const audioRef = useRef<HTMLAudioElement>(null);

	// Clean up audio URL when component unmounts or file changes
	useEffect(() => {
		return () => {
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
			}
		};
	}, [audioUrl]);

	const handleFile = useCallback(
		async (file: File) => {
			setError(null);
			setIsLoading(true);
			setIsPlaying(false);

			// Clean up previous audio URL
			if (audioUrl) {
				URL.revokeObjectURL(audioUrl);
				setAudioUrl(null);
			}

			try {
				// Validate file
				const validation = validateFile(file);
				if (!validation.valid) {
					setError(validation.error ?? "Invalid file");
					setIsLoading(false);
					return;
				}

				// Get audio duration for preview
				let audioDuration: number | undefined;
				try {
					audioDuration = await getAudioDuration(file);
				} catch {
					// Duration is optional, continue without it
				}

				// Read file as base64
				const content = await readFileAsBase64(file);

				// Determine MIME type
				let mimeType = file.type;
				if (!mimeType || !(mimeType in SUPPORTED_TYPES)) {
					// Fallback based on extension
					mimeType = getMimeTypeFromExtension(file.name) ?? "audio/mpeg";
				}

				// Create audio URL for preview
				const newAudioUrl = URL.createObjectURL(file);
				setAudioUrl(newAudioUrl);
				setDuration(audioDuration ?? 0);
				setCurrentTime(0);

				onFileSelected({
					content,
					mimeType,
					filename: file.name,
					duration: audioDuration,
				});
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to read file",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[audioUrl, onFileSelected],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			if (disabled) {
				return;
			}

			const files = e.dataTransfer.files;
			if (files.length > 0) {
				handleFile(files[0]);
			}
		},
		[disabled, handleFile],
	);

	const handleDragOver = useCallback(
		(e: React.DragEvent<HTMLElement>) => {
			e.preventDefault();
			e.stopPropagation();
			if (!disabled) {
				setIsDragging(true);
			}
		},
		[disabled],
	);

	const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				handleFile(files[0]);
			}
			// Reset input value to allow re-selecting the same file
			e.target.value = "";
		},
		[handleFile],
	);

	const handleClick = useCallback(() => {
		if (!disabled) {
			fileInputRef.current?.click();
		}
	}, [disabled]);

	const handleClear = useCallback(() => {
		setError(null);
		setIsPlaying(false);
		setCurrentTime(0);
		setDuration(0);
		if (audioUrl) {
			URL.revokeObjectURL(audioUrl);
			setAudioUrl(null);
		}
		onFileClear();
	}, [audioUrl, onFileClear]);

	const togglePlayPause = useCallback(() => {
		if (!audioRef.current) {
			return;
		}

		if (isPlaying) {
			audioRef.current.pause();
		} else {
			audioRef.current.play();
		}
		setIsPlaying(!isPlaying);
	}, [isPlaying]);

	const handleTimeUpdate = useCallback(() => {
		if (audioRef.current) {
			setCurrentTime(audioRef.current.currentTime);
		}
	}, []);

	const handleLoadedMetadata = useCallback(() => {
		if (audioRef.current) {
			setDuration(audioRef.current.duration);
		}
	}, []);

	const handleEnded = useCallback(() => {
		setIsPlaying(false);
		setCurrentTime(0);
		if (audioRef.current) {
			audioRef.current.currentTime = 0;
		}
	}, []);

	const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const newTime = Number.parseFloat(e.target.value);
		if (audioRef.current) {
			audioRef.current.currentTime = newTime;
			setCurrentTime(newTime);
		}
	}, []);

	// Get file type info for display
	const fileTypeInfo = selectedFile?.mimeType
		? SUPPORTED_TYPES[selectedFile.mimeType as keyof typeof SUPPORTED_TYPES]
		: null;

	return (
		<div className={cn("space-y-2", className)}>
			{!selectedFile ? (
				<button
					type="button"
					disabled={disabled}
					onClick={handleClick}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					className={cn(
						"relative flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all",
						isDragging
							? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30"
							: "border-muted-foreground/25 bg-muted/30 hover:border-cyan-400 hover:bg-muted/50",
						disabled && "cursor-not-allowed opacity-50",
						error && "border-red-300 bg-red-50 dark:bg-red-950/20",
					)}
				>
					<input
						ref={fileInputRef}
						type="file"
						accept={SUPPORTED_EXTENSIONS.join(",")}
						onChange={handleInputChange}
						className="hidden"
						disabled={disabled}
					/>

					{isLoading ? (
						<>
							<Loader2Icon className="mb-3 size-10 animate-spin text-cyan-500" />
							<p className="text-muted-foreground text-sm">
								Reading audio file...
							</p>
						</>
					) : error ? (
						<>
							<AlertCircleIcon className="mb-3 size-10 text-red-500" />
							<p className="text-center font-medium text-red-600 text-sm">
								{error}
							</p>
							<p className="mt-2 text-muted-foreground text-xs">
								Click to try again
							</p>
						</>
					) : (
						<>
							<div
								className={cn(
									"mb-4 flex size-14 items-center justify-center rounded-xl transition-colors",
									isDragging
										? "bg-cyan-500 text-white"
										: "bg-muted text-muted-foreground",
								)}
							>
								<UploadCloudIcon className="size-7" />
							</div>
							<p className="mb-2 text-center font-medium">
								{isDragging
									? "Drop your audio file here"
									: "Drag & drop your audio file here"}
							</p>
							<p className="mb-4 text-center text-muted-foreground text-sm">
								or click to browse
							</p>
							<div className="flex flex-wrap justify-center gap-2">
								{SUPPORTED_EXTENSIONS.map((ext) => (
									<span
										key={ext}
										className="rounded-full bg-background px-2.5 py-1 text-muted-foreground text-xs shadow-sm"
									>
										{ext.toUpperCase().slice(1)}
									</span>
								))}
							</div>
							<p className="mt-3 text-muted-foreground text-xs">
								Max file size: {formatBytes(MAX_FILE_SIZE)}
							</p>
						</>
					)}
				</button>
			) : (
				<div className="rounded-xl border-2 border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-800 dark:bg-cyan-950/30">
					{/* File info header */}
					<div className="flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
							<Music2Icon className="size-5 text-cyan-600 dark:text-cyan-400" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<p className="truncate font-medium text-sm">
									{selectedFile.filename}
								</p>
								<CheckCircleIcon className="size-4 shrink-0 text-cyan-500" />
							</div>
							<p className="text-muted-foreground text-xs">
								{fileTypeInfo?.label ?? "Audio"} file
								{duration > 0 && ` - ${formatDuration(duration)}`}
							</p>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={handleClear}
							disabled={disabled}
							className="shrink-0 text-muted-foreground hover:text-foreground"
						>
							<XIcon className="size-4" />
							<span className="sr-only">Remove file</span>
						</Button>
					</div>

					{/* Audio preview player */}
					{audioUrl && (
						<div className="mt-4 space-y-2">
	{/* biome-ignore lint/a11y/useMediaCaption: Audio preview for user-uploaded files doesn't require captions */}
							<audio
								ref={audioRef}
								src={audioUrl}
								onTimeUpdate={handleTimeUpdate}
								onLoadedMetadata={handleLoadedMetadata}
								onEnded={handleEnded}
								className="hidden"
							/>

							{/* Player controls */}
							<div className="flex items-center gap-3">
								<Button
									type="button"
									variant="secondary"
									size="icon"
									onClick={togglePlayPause}
									disabled={disabled}
									className="size-10 shrink-0 rounded-full"
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

								{/* Progress bar */}
								<div className="flex flex-1 items-center gap-2">
									<span className="w-12 text-right font-mono text-muted-foreground text-xs">
										{formatDuration(currentTime)}
									</span>
									<input
										type="range"
										min={0}
										max={duration || 100}
										step={0.1}
										value={currentTime}
										onChange={handleSeek}
										disabled={disabled || !duration}
										className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-cyan-200 dark:bg-cyan-800 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-600 [&::-webkit-slider-thumb]:dark:bg-cyan-400"
									/>
									<span className="w-12 font-mono text-muted-foreground text-xs">
										{formatDuration(duration)}
									</span>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* Show error message if validation failed after file selected */}
			{error && selectedFile && (
				<Alert variant="error">
					<AlertCircleIcon className="size-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
