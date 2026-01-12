"use client";

import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import {
	AlertCircleIcon,
	CheckCircleIcon,
	FileIcon,
	FileTextIcon,
	Loader2Icon,
	UploadCloudIcon,
	XIcon,
} from "lucide-react";
import React, { useCallback, useRef, useState } from "react";

/**
 * Maximum file size for contract documents (25MB).
 */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Supported file types for document upload.
 */
const SUPPORTED_TYPES = {
	"application/pdf": { label: "PDF", icon: FileTextIcon },
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
		label: "DOCX",
		icon: FileIcon,
	},
	"text/plain": { label: "TXT", icon: FileTextIcon },
} as const;

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt"];

/**
 * File data structure returned by the component.
 */
export interface DocumentFileData {
	content: string;
	mimeType: string;
	filename: string;
}

interface DocumentUploadProps {
	/**
	 * Callback when a file is successfully selected and read.
	 */
	onFileSelected: (fileData: DocumentFileData) => void;
	/**
	 * Callback when the selected file is cleared.
	 */
	onFileClear: () => void;
	/**
	 * Current file data (for controlled component behavior).
	 */
	selectedFile?: DocumentFileData | null;
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
		error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file.",
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
			// Remove the data URL prefix (e.g., "data:application/pdf;base64,")
			const base64 = result.split(",")[1];
			resolve(base64);
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}

/**
 * Document upload component with drag-and-drop support.
 * Accepts PDF, DOCX, and TXT files up to 25MB.
 */
export function DocumentUpload({
	onFileSelected,
	onFileClear,
	selectedFile,
	disabled = false,
	className,
}: DocumentUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		async (file: File) => {
			setError(null);
			setIsLoading(true);

			try {
				// Validate file
				const validation = validateFile(file);
				if (!validation.valid) {
					setError(validation.error ?? "Invalid file");
					setIsLoading(false);
					return;
				}

				// Read file as base64
				const content = await readFileAsBase64(file);

				// Determine MIME type
				let mimeType = file.type;
				if (!mimeType) {
					// Fallback based on extension
					const ext = file.name
						.toLowerCase()
						.slice(file.name.lastIndexOf("."));
					if (ext === ".pdf") {
						mimeType = "application/pdf";
					} else if (ext === ".docx") {
						mimeType =
							"application/vnd.openxmlformats-officedocument.wordprocessingml.document";
					} else if (ext === ".txt") {
						mimeType = "text/plain";
					}
				}

				onFileSelected({
					content,
					mimeType,
					filename: file.name,
				});
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to read file",
				);
			} finally {
				setIsLoading(false);
			}
		},
		[onFileSelected],
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

	const handleDragLeave = useCallback(
		(e: React.DragEvent<HTMLElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);
		},
		[],
	);

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
		onFileClear();
	}, [onFileClear]);

	// Get file type info for display
	const fileTypeInfo = selectedFile?.mimeType
		? SUPPORTED_TYPES[selectedFile.mimeType as keyof typeof SUPPORTED_TYPES]
		: null;
	const FileTypeIcon = fileTypeInfo?.icon ?? FileIcon;

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
						"relative flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all",
						isDragging
							? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
							: "border-muted-foreground/25 bg-muted/30 hover:border-violet-400 hover:bg-muted/50",
						disabled && "cursor-not-allowed opacity-50",
						error && "border-red-300 bg-red-50 dark:bg-red-950/20",
					)}
				>
					<input
						ref={fileInputRef}
						type="file"
						accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
						onChange={handleInputChange}
						className="hidden"
						disabled={disabled}
					/>

					{isLoading ? (
						<>
							<Loader2Icon className="mb-3 size-10 animate-spin text-violet-500" />
							<p className="text-muted-foreground text-sm">
								Reading file...
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
							<UploadCloudIcon
								className={cn(
									"mb-3 size-10 transition-colors",
									isDragging
										? "text-violet-500"
										: "text-muted-foreground",
								)}
							/>
							<p className="text-center font-medium text-sm">
								<span className="text-violet-600">
									Click to upload
								</span>{" "}
								or drag and drop
							</p>
							<p className="mt-1 text-center text-muted-foreground text-xs">
								PDF, DOCX, or TXT up to 25MB
							</p>
						</>
					)}
				</button>
			) : (
				<div className="flex items-center gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
					<div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
						<FileTypeIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<p className="truncate font-medium text-sm">
								{selectedFile.filename}
							</p>
							<CheckCircleIcon className="size-4 shrink-0 text-emerald-500" />
						</div>
						<p className="text-muted-foreground text-xs">
							{fileTypeInfo?.label ?? "Document"} file ready for
							analysis
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
			)}
		</div>
	);
}
