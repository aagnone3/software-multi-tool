"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	DownloadIcon,
	FileAudioIcon,
	FileIcon,
	FileImageIcon,
	FileTextIcon,
	FileVideoIcon,
	MoreHorizontalIcon,
	PlusIcon,
	SearchIcon,
	TagIcon,
	TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { DeleteFileDialog } from "./DeleteFileDialog";
import { FileUploader } from "./FileUploader";
import { TagInput } from "./TagInput";

interface FilesTableProps {
	organizationId: string;
}

type MimeCategory = "audio" | "image" | "video" | "document" | "other" | "all";

function formatFileSize(bytes: number): string {
	if (bytes === 0) {
		return "0 B";
	}
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function getMimeCategory(mimeType: string): MimeCategory {
	if (mimeType.startsWith("audio/")) {
		return "audio";
	}
	if (mimeType.startsWith("image/")) {
		return "image";
	}
	if (mimeType.startsWith("video/")) {
		return "video";
	}
	if (
		mimeType.startsWith("application/pdf") ||
		mimeType.startsWith("application/msword") ||
		mimeType.startsWith("application/vnd.openxmlformats") ||
		mimeType.startsWith("text/")
	) {
		return "document";
	}
	return "other";
}

function getFileIcon(mimeType: string) {
	const category = getMimeCategory(mimeType);
	switch (category) {
		case "audio":
			return FileAudioIcon;
		case "image":
			return FileImageIcon;
		case "video":
			return FileVideoIcon;
		case "document":
			return FileTextIcon;
		default:
			return FileIcon;
	}
}

export function FilesTable(_props: FilesTableProps) {
	const [search, setSearch] = useState("");
	const [mimeCategory, setMimeCategory] = useState<MimeCategory>("all");
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [page, setPage] = useState(1);
	const [fileToDelete, setFileToDelete] = useState<{
		id: string;
		filename: string;
	} | null>(null);
	const [editingTagsFileId, setEditingTagsFileId] = useState<string | null>(
		null,
	);
	const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

	const queryClient = useQueryClient();

	// Fetch files
	const filesQuery = useQuery(
		orpc.files.list.queryOptions({
			input: {
				mimeCategory: mimeCategory === "all" ? undefined : mimeCategory,
				tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
				search: search || undefined,
				page,
				pageSize: 20,
			},
		}),
	);

	// Fetch tags for filtering
	const tagsQuery = useQuery(orpc.files.listTags.queryOptions({}));

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: (fileId: string) => orpcClient.files.delete({ fileId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["files"] });
			setFileToDelete(null);
		},
	});

	// Download handler
	const handleDownload = async (fileId: string) => {
		const { downloadUrl } = await orpcClient.files.getDownloadUrl({
			fileId,
		});
		window.open(downloadUrl, "_blank");
	};

	const files = filesQuery.data?.files ?? [];
	const pagination = filesQuery.data?.pagination;
	const tags = tagsQuery.data?.tags ?? [];

	return (
		<div className="space-y-4">
			{/* Filters and Upload Button */}
			<div className="flex flex-wrap gap-4">
				<div className="relative flex-1 min-w-[200px]">
					<SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search files..."
						value={search}
						onChange={(e) => {
							setSearch(e.target.value);
							setPage(1);
						}}
						className="pl-9"
					/>
				</div>

				<Select
					value={mimeCategory}
					onValueChange={(value: MimeCategory) => {
						setMimeCategory(value);
						setPage(1);
					}}
				>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="File type" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All types</SelectItem>
						<SelectItem value="audio">Audio</SelectItem>
						<SelectItem value="image">Images</SelectItem>
						<SelectItem value="video">Video</SelectItem>
						<SelectItem value="document">Documents</SelectItem>
						<SelectItem value="other">Other</SelectItem>
					</SelectContent>
				</Select>

				{tags.length > 0 && (
					<Select
						value={selectedTagIds[0] ?? "all"}
						onValueChange={(value) => {
							setSelectedTagIds(value === "all" ? [] : [value]);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-[180px]">
							<TagIcon className="mr-2 size-4" />
							<SelectValue placeholder="Filter by tag" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All tags</SelectItem>
							{tags.map((tag) => (
								<SelectItem key={tag.id} value={tag.id}>
									{tag.name} ({tag.fileCount})
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}

				<Button onClick={() => setIsUploadDialogOpen(true)}>
					<PlusIcon className="mr-2 size-4" />
					Upload Files
				</Button>
			</div>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Size</TableHead>
							<TableHead>Uploaded</TableHead>
							<TableHead>Tags</TableHead>
							<TableHead className="w-[100px]">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filesQuery.isLoading ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center text-muted-foreground"
								>
									Loading files...
								</TableCell>
							</TableRow>
						) : files.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="text-center text-muted-foreground"
								>
									No files found
								</TableCell>
							</TableRow>
						) : (
							files.map((file) => {
								const FileIconComponent = getFileIcon(
									file.mimeType,
								);
								const isEditingTags =
									editingTagsFileId === file.id;

								return (
									<TableRow key={file.id}>
										<TableCell>
											<div className="flex items-center gap-2">
												<FileIconComponent className="size-4 text-muted-foreground" />
												<span className="font-medium truncate max-w-[200px]">
													{file.filename}
												</span>
											</div>
										</TableCell>
										<TableCell>
											<span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium capitalize bg-muted text-muted-foreground">
												{getMimeCategory(file.mimeType)}
											</span>
										</TableCell>
										<TableCell>
											{formatFileSize(file.size)}
										</TableCell>
										<TableCell>
											{new Date(
												file.createdAt,
											).toLocaleDateString()}
										</TableCell>
										<TableCell>
											{isEditingTags ? (
												<TagInput
													fileId={file.id}
													currentTags={file.tags}
													availableTags={tags}
													onClose={() =>
														setEditingTagsFileId(
															null,
														)
													}
												/>
											) : (
												<button
													type="button"
													className="flex flex-wrap gap-1 cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 text-left"
													onClick={() =>
														setEditingTagsFileId(
															file.id,
														)
													}
												>
													{file.tags.length === 0 ? (
														<span className="text-muted-foreground text-sm">
															Click to add tags
														</span>
													) : (
														file.tags.map((tag) => (
															<span
																key={tag.id}
																className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary"
															>
																{tag.name}
															</span>
														))
													)}
												</button>
											)}
										</TableCell>
										<TableCell>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
													>
														<MoreHorizontalIcon className="size-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={() =>
															handleDownload(
																file.id,
															)
														}
													>
														<DownloadIcon className="mr-2 size-4" />
														Download
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															setFileToDelete({
																id: file.id,
																filename:
																	file.filename,
															})
														}
														className="text-destructive"
													>
														<TrashIcon className="mr-2 size-4" />
														Delete
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{pagination && pagination.totalPages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-sm text-muted-foreground">
						Showing {(page - 1) * pagination.pageSize + 1} to{" "}
						{Math.min(
							page * pagination.pageSize,
							pagination.totalCount,
						)}{" "}
						of {pagination.totalCount} files
					</p>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() =>
								setPage((p) =>
									Math.min(pagination.totalPages, p + 1),
								)
							}
							disabled={page === pagination.totalPages}
						>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* Delete confirmation dialog */}
			<DeleteFileDialog
				file={fileToDelete}
				isOpen={!!fileToDelete}
				onClose={() => setFileToDelete(null)}
				onConfirm={() => {
					if (fileToDelete) {
						deleteMutation.mutate(fileToDelete.id);
					}
				}}
				isDeleting={deleteMutation.isPending}
			/>

			{/* Upload dialog */}
			<FileUploader
				isOpen={isUploadDialogOpen}
				onClose={() => setIsUploadDialogOpen(false)}
			/>
		</div>
	);
}
