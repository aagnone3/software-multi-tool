"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { PlusIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Tag {
	id: string;
	name: string;
}

interface TagInputProps {
	fileId: string;
	currentTags: Tag[];
	availableTags: Tag[];
	onClose: () => void;
}

export function TagInput({
	fileId,
	currentTags,
	availableTags,
	onClose,
}: TagInputProps) {
	const [newTagName, setNewTagName] = useState("");
	const [isAddingTag, setIsAddingTag] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	// Focus input when entering add mode
	useEffect(() => {
		if (isAddingTag && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isAddingTag]);

	// Handle click outside to close
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as Node;

			// Don't close if clicking inside our container
			if (containerRef.current?.contains(target)) {
				return;
			}

			// Don't close if clicking on Radix dropdown content (portaled outside container)
			if (
				target instanceof Element &&
				target.closest("[data-radix-popper-content-wrapper]")
			) {
				return;
			}

			onClose();
		}

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [onClose]);

	// Add tag mutation
	const addTagMutation = useMutation({
		mutationFn: (tagName: string) =>
			orpcClient.files.addTag({ fileId, tagName }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["files"] });
			setNewTagName("");
			setIsAddingTag(false);
		},
	});

	// Remove tag mutation
	const removeTagMutation = useMutation({
		mutationFn: (tagId: string) =>
			orpcClient.files.removeTag({ fileId, tagId }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["files"] });
		},
	});

	const handleAddTag = (tagName: string) => {
		if (tagName.trim()) {
			addTagMutation.mutate(tagName.trim());
		}
	};

	const handleRemoveTag = (tagId: string) => {
		removeTagMutation.mutate(tagId);
	};

	// Filter available tags that aren't already applied
	const currentTagIds = new Set(currentTags.map((t) => t.id));
	const suggestedTags = availableTags.filter((t) => !currentTagIds.has(t.id));

	return (
		<div ref={containerRef} className="flex flex-wrap gap-1 items-center">
			{currentTags.map((tag) => (
				<span
					key={tag.id}
					className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary"
				>
					{tag.name}
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							handleRemoveTag(tag.id);
						}}
						className="ml-1 rounded-full hover:bg-muted"
						disabled={removeTagMutation.isPending}
					>
						<XIcon className="size-3" />
					</button>
				</span>
			))}

			{isAddingTag ? (
				<div className="flex gap-1 items-center">
					<input
						ref={inputRef}
						type="text"
						placeholder="Tag name..."
						value={newTagName}
						onChange={(e) => setNewTagName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleAddTag(newTagName);
							}
							if (e.key === "Escape") {
								setIsAddingTag(false);
								setNewTagName("");
							}
						}}
						className="h-6 w-24 text-xs rounded border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
					/>
					<Button
						size="sm"
						variant="ghost"
						className="h-6 px-2"
						onClick={() => handleAddTag(newTagName)}
						disabled={
							!newTagName.trim() || addTagMutation.isPending
						}
					>
						<PlusIcon className="size-3" />
					</Button>
				</div>
			) : (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="h-6 px-2"
							onClick={(e) => {
								e.stopPropagation();
							}}
						>
							<PlusIcon className="size-3 mr-1" />
							Add
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start" className="w-48">
						<DropdownMenuItem onClick={() => setIsAddingTag(true)}>
							Create new tag...
						</DropdownMenuItem>
						{suggestedTags.length > 0 && (
							<>
								<div className="px-2 py-1 text-xs text-muted-foreground">
									Existing tags:
								</div>
								{suggestedTags.slice(0, 8).map((tag) => (
									<DropdownMenuItem
										key={tag.id}
										onClick={() => handleAddTag(tag.name)}
									>
										{tag.name}
									</DropdownMenuItem>
								))}
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</div>
	);
}
