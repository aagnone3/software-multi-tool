"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@ui/components/alert";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Progress } from "@ui/components/progress";
import { cn } from "@ui/lib";
import {
	AlertCircleIcon,
	CheckCircleIcon,
	FileIcon,
	Loader2Icon,
	UploadCloudIcon,
	XIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";

/**
 * Maximum file size (50MB)
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface FileUploaderProps {
	isOpen: boolean;
	onClose: () => void;
}

interface UploadingFile {
	file: File;
	progress: number;
	status: "pending" | "uploading" | "registering" | "complete" | "error";
	error?: string;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) {
		return "0 B";
	}
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function validateFile(file: File): { valid: boolean; error?: string } {
	if (file.size > MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `File size (${formatBytes(file.size)}) exceeds maximum (${formatBytes(MAX_FILE_SIZE)})`,
		};
	}
	return { valid: true };
}

export function FileUploader({ isOpen, onClose }: FileUploaderProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const uploadMutation = useMutation({
		mutationFn: async (file: File) => {
			// Update status to uploading
			setUploadingFiles((prev) =>
				prev.map((f) =>
					f.file === file
						? { ...f, status: "uploading" as const }
						: f,
				),
			);

			// Get signed upload URL
			const { signedUploadUrl, path, bucket } =
				await orpcClient.files.getUploadUrl({
					filename: file.name,
					contentType: file.type || "application/octet-stream",
				});

			// Upload file to storage
			const xhr = new XMLHttpRequest();

			await new Promise<void>((resolve, reject) => {
				xhr.upload.addEventListener("progress", (event) => {
					if (event.lengthComputable) {
						const progress = Math.round(
							(event.loaded / event.total) * 100,
						);
						setUploadingFiles((prev) =>
							prev.map((f) =>
								f.file === file ? { ...f, progress } : f,
							),
						);
					}
				});

				xhr.addEventListener("load", () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						resolve();
					} else {
						reject(new Error(`Upload failed: ${xhr.statusText}`));
					}
				});

				xhr.addEventListener("error", () => {
					reject(new Error("Upload failed"));
				});

				xhr.open("PUT", signedUploadUrl);
				xhr.setRequestHeader(
					"Content-Type",
					file.type || "application/octet-stream",
				);
				xhr.send(file);
			});

			// Update status to registering
			setUploadingFiles((prev) =>
				prev.map((f) =>
					f.file === file
						? { ...f, status: "registering" as const }
						: f,
				),
			);

			// Register file in database
			await orpcClient.files.create({
				filename: file.name,
				mimeType: file.type || "application/octet-stream",
				size: file.size,
				storagePath: path,
				bucket,
			});

			return { filename: file.name };
		},
		onSuccess: (_data, file) => {
			setUploadingFiles((prev) =>
				prev.map((f) =>
					f.file === file
						? { ...f, status: "complete" as const, progress: 100 }
						: f,
				),
			);
			queryClient.invalidateQueries({ queryKey: ["files"] });
		},
		onError: (error, file) => {
			setUploadingFiles((prev) =>
				prev.map((f) =>
					f.file === file
						? {
								...f,
								status: "error" as const,
								error:
									error instanceof Error
										? error.message
										: "Upload failed",
							}
						: f,
				),
			);
		},
	});

	const processFiles = useCallback(
		(files: FileList | File[]) => {
			const newFiles: UploadingFile[] = [];
			const fileArray = Array.from(files);

			for (const file of fileArray) {
				const validation = validateFile(file);
				if (validation.valid) {
					newFiles.push({
						file,
						progress: 0,
						status: "pending",
					});
				} else {
					newFiles.push({
						file,
						progress: 0,
						status: "error",
						error: validation.error,
					});
				}
			}

			setUploadingFiles((prev) => [...prev, ...newFiles]);

			// Start uploading valid files
			for (const uploadFile of newFiles) {
				if (uploadFile.status === "pending") {
					uploadMutation.mutate(uploadFile.file);
				}
			}
		},
		[uploadMutation],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			if (e.dataTransfer.files.length > 0) {
				processFiles(e.dataTransfer.files);
			}
		},
		[processFiles],
	);

	const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				processFiles(e.target.files);
			}
			e.target.value = "";
		},
		[processFiles],
	);

	const handleClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleRemoveFile = useCallback((file: File) => {
		setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
	}, []);

	const handleClose = useCallback(() => {
		// Only allow closing if no uploads are in progress
		const hasActiveUploads = uploadingFiles.some(
			(f) => f.status === "uploading" || f.status === "registering",
		);
		if (!hasActiveUploads) {
			setUploadingFiles([]);
			onClose();
		}
	}, [uploadingFiles, onClose]);

	const hasActiveUploads = uploadingFiles.some(
		(f) => f.status === "uploading" || f.status === "registering",
	);
	const allComplete =
		uploadingFiles.length > 0 &&
		uploadingFiles.every(
			(f) => f.status === "complete" || f.status === "error",
		);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Upload Files</DialogTitle>
					<DialogDescription>
						Drag and drop files or click to browse. Files up to{" "}
						{formatBytes(MAX_FILE_SIZE)} are supported.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Drop zone */}
					<button
						type="button"
						onClick={handleClick}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						disabled={hasActiveUploads}
						className={cn(
							"relative flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all",
							isDragging
								? "border-primary bg-primary/5"
								: "border-muted-foreground/25 bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
							hasActiveUploads && "cursor-not-allowed opacity-50",
						)}
					>
						<input
							ref={fileInputRef}
							type="file"
							multiple
							onChange={handleInputChange}
							className="hidden"
							disabled={hasActiveUploads}
						/>

						<div
							className={cn(
								"mb-4 flex size-12 items-center justify-center rounded-xl transition-colors",
								isDragging
									? "bg-primary text-primary-foreground"
									: "bg-muted text-muted-foreground",
							)}
						>
							<UploadCloudIcon className="size-6" />
						</div>
						<p className="mb-1 text-center font-medium">
							{isDragging
								? "Drop your files here"
								: "Drag & drop files here"}
						</p>
						<p className="text-center text-muted-foreground text-sm">
							or click to browse
						</p>
					</button>

					{/* Upload list */}
					{uploadingFiles.length > 0 && (
						<div className="space-y-2 max-h-[300px] overflow-y-auto">
							{uploadingFiles.map((uploadFile, index) => (
								<div
									key={`${uploadFile.file.name}-${index}`}
									className={cn(
										"flex items-center gap-3 rounded-lg border p-3",
										uploadFile.status === "complete" &&
											"border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
										uploadFile.status === "error" &&
											"border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
									)}
								>
									<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
										<FileIcon className="size-5 text-muted-foreground" />
									</div>

									<div className="flex-1 min-w-0">
										<p className="truncate font-medium text-sm">
											{uploadFile.file.name}
										</p>
										<p className="text-muted-foreground text-xs">
											{formatBytes(uploadFile.file.size)}
										</p>

										{(uploadFile.status === "uploading" ||
											uploadFile.status ===
												"registering") && (
											<div className="mt-2">
												<Progress
													value={uploadFile.progress}
													className="h-1"
												/>
												<p className="mt-1 text-muted-foreground text-xs">
													{uploadFile.status ===
													"registering"
														? "Registering file..."
														: `${uploadFile.progress}%`}
												</p>
											</div>
										)}

										{uploadFile.status === "error" && (
											<p className="mt-1 text-red-600 text-xs">
												{uploadFile.error}
											</p>
										)}
									</div>

									{uploadFile.status === "complete" && (
										<CheckCircleIcon className="size-5 shrink-0 text-green-500" />
									)}

									{uploadFile.status === "error" && (
										<AlertCircleIcon className="size-5 shrink-0 text-red-500" />
									)}

									{(uploadFile.status === "uploading" ||
										uploadFile.status ===
											"registering") && (
										<Loader2Icon className="size-5 shrink-0 animate-spin text-primary" />
									)}

									{(uploadFile.status === "complete" ||
										uploadFile.status === "error" ||
										uploadFile.status === "pending") && (
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="size-8 shrink-0"
											onClick={() =>
												handleRemoveFile(
													uploadFile.file,
												)
											}
										>
											<XIcon className="size-4" />
											<span className="sr-only">
												Remove
											</span>
										</Button>
									)}
								</div>
							))}
						</div>
					)}

					{/* Actions */}
					<div className="flex justify-end gap-2">
						<Button
							variant="outline"
							onClick={handleClose}
							disabled={hasActiveUploads}
						>
							{allComplete ? "Done" : "Cancel"}
						</Button>
					</div>

					{/* Warning about active uploads */}
					{hasActiveUploads && (
						<Alert>
							<Loader2Icon className="size-4 animate-spin" />
							<AlertDescription>
								Please wait for uploads to complete before
								closing.
							</AlertDescription>
						</Alert>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
