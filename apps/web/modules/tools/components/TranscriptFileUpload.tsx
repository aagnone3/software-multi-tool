"use client";

import { Alert, AlertDescription } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { AlertCircleIcon, FileTextIcon, UploadIcon, XIcon } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

/**
 * Supported transcript file extensions and their display names.
 */
const SUPPORTED_FORMATS = {
	".txt": "Plain Text",
	".docx": "Word Document",
	".vtt": "WebVTT (Video Captions)",
	".srt": "SubRip (Subtitles)",
} as const;

const SUPPORTED_EXTENSIONS = Object.keys(SUPPORTED_FORMATS);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * File with base64 content ready for submission.
 */
export interface TranscriptFileData {
	content: string; // base64 encoded
	filename: string;
	mimeType?: string;
}

interface TranscriptFileUploadProps {
	/** Callback when a file is selected and parsed */
	onFileSelect: (file: TranscriptFileData | null) => void;
	/** Callback when file text is extracted (for preview) */
	onTextExtracted?: (text: string | null) => void;
	/** Currently selected file data */
	value?: TranscriptFileData | null;
	/** Whether the component is disabled */
	disabled?: boolean;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Format bytes to human-readable string.
 */
function formatFileSize(bytes: number): string {
	if (bytes === 0) {
		return "0 Bytes";
	}
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * Validate file extension.
 */
function isValidExtension(filename: string): boolean {
	const ext = `.${filename.split(".").pop()?.toLowerCase()}`;
	return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Get MIME type from filename.
 */
function getMimeType(filename: string): string {
	const ext = filename.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "txt":
			return "text/plain";
		case "docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		case "vtt":
			return "text/vtt";
		case "srt":
			return "application/x-subrip";
		default:
			return "application/octet-stream";
	}
}

/**
 * Transcript file upload component with drag-and-drop support.
 */
export function TranscriptFileUpload({
	onFileSelect,
	onTextExtracted,
	value,
	disabled = false,
	className,
}: TranscriptFileUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const processFile = useCallback(
		async (file: File) => {
			setError(null);

			// Validate file size
			if (file.size > MAX_FILE_SIZE) {
				setError(
					`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`,
				);
				return;
			}

			// Validate file extension
			if (!isValidExtension(file.name)) {
				setError(
					`Unsupported file format. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`,
				);
				return;
			}

			try {
				// Read file as ArrayBuffer for base64 encoding
				const arrayBuffer = await file.arrayBuffer();
				const base64 = btoa(
					new Uint8Array(arrayBuffer).reduce(
						(data, byte) => data + String.fromCharCode(byte),
						"",
					),
				);

				const fileData: TranscriptFileData = {
					content: base64,
					filename: file.name,
					mimeType: getMimeType(file.name),
				};

				setSelectedFile(file);
				onFileSelect(fileData);

				// Also try to extract text for preview (for TXT files only for now)
				if (file.name.toLowerCase().endsWith(".txt")) {
					const text = await file.text();
					onTextExtracted?.(text);
				} else {
					// For other formats, text preview will come from backend
					onTextExtracted?.(null);
				}
			} catch (err) {
				setError("Failed to read file. Please try again.");
				console.error("File read error:", err);
			}
		},
		[onFileSelect, onTextExtracted],
	);

	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (!disabled) {
				setIsDragging(true);
			}
		},
		[disabled],
	);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			if (disabled) {
				return;
			}

			const files = e.dataTransfer.files;
			if (files.length > 0) {
				processFile(files[0]);
			}
		},
		[disabled, processFile],
	);

	const handleFileInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				processFile(files[0]);
			}
		},
		[processFile],
	);

	const handleClear = useCallback(() => {
		setSelectedFile(null);
		setError(null);
		onFileSelect(null);
		onTextExtracted?.(null);
		if (inputRef.current) {
			inputRef.current.value = "";
		}
	}, [onFileSelect, onTextExtracted]);

	const handleClick = useCallback(() => {
		if (!disabled) {
			inputRef.current?.click();
		}
	}, [disabled]);

	return (
		<div className={cn("space-y-3", className)}>
			{/* Hidden file input */}
			<input
				ref={inputRef}
				type="file"
				accept={SUPPORTED_EXTENSIONS.join(",")}
				onChange={handleFileInputChange}
				className="hidden"
				disabled={disabled}
			/>

			{/* Drop zone */}
			{!selectedFile && !value ? (
				<button
					type="button"
					tabIndex={disabled ? -1 : 0}
					onClick={handleClick}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					disabled={disabled}
					className={cn(
						"flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all",
						isDragging
							? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
							: "border-muted-foreground/25 bg-muted/30 hover:border-indigo-500/50 hover:bg-muted/50",
						disabled &&
							"cursor-not-allowed opacity-50 hover:border-muted-foreground/25 hover:bg-muted/30",
						!disabled && "cursor-pointer",
					)}
				>
					<div
						className={cn(
							"mb-4 flex size-14 items-center justify-center rounded-xl",
							isDragging
								? "bg-indigo-500 text-white"
								: "bg-muted text-muted-foreground",
						)}
					>
						<UploadIcon className="size-7" />
					</div>
					<p className="mb-2 text-center font-medium">
						{isDragging
							? "Drop your transcript file here"
							: "Drag & drop your transcript file here"}
					</p>
					<p className="mb-4 text-center text-muted-foreground text-sm">
						or click to browse
					</p>
					<div className="flex flex-wrap justify-center gap-2">
						{Object.entries(SUPPORTED_FORMATS).map(
							([ext, _name]) => (
								<span
									key={ext}
									className="rounded-full bg-background px-2.5 py-1 text-muted-foreground text-xs shadow-sm"
								>
									{ext.toUpperCase().slice(1)}
								</span>
							),
						)}
					</div>
					<p className="mt-3 text-muted-foreground text-xs">
						Max file size: {formatFileSize(MAX_FILE_SIZE)}
					</p>
				</button>
			) : (
				/* Selected file display */
				<div className="flex items-center gap-3 rounded-xl border-2 border-indigo-500/30 bg-indigo-50/50 p-4 dark:bg-indigo-900/20">
					<div className="flex size-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
						<FileTextIcon className="size-6 text-indigo-600 dark:text-indigo-400" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="truncate font-medium">
							{selectedFile?.name || value?.filename}
						</p>
						<p className="text-muted-foreground text-sm">
							{selectedFile
								? formatFileSize(selectedFile.size)
								: "File ready"}
						</p>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={handleClear}
						disabled={disabled}
						className="shrink-0"
					>
						<XIcon className="size-4" />
						<span className="sr-only">Remove file</span>
					</Button>
				</div>
			)}

			{/* Error message */}
			{error && (
				<Alert variant="error">
					<AlertCircleIcon className="size-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
