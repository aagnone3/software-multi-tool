"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import {
	BookmarkIcon,
	FolderIcon,
	FolderOpenIcon,
	PlusIcon,
	TrashIcon,
	XIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import { useToolCollections } from "../hooks/use-tool-collections";

interface ToolCollectionsPanelProps {
	/** Current tool slug — when provided, shows "Add to Collection" UI */
	currentToolSlug?: string;
	className?: string;
}

export function ToolCollectionsPanel({
	currentToolSlug,
	className,
}: ToolCollectionsPanelProps) {
	const {
		collections,
		createCollection,
		deleteCollection,
		addToolToCollection,
		removeToolFromCollection,
		getCollectionsForTool,
	} = useToolCollections();

	const { track } = useProductAnalytics();
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [newName, setNewName] = useState("");
	const [newDesc, setNewDesc] = useState("");

	const currentToolCollections = currentToolSlug
		? getCollectionsForTool(currentToolSlug)
		: [];

	function handleCreate() {
		if (!newName.trim()) return;
		const created = createCollection(
			newName,
			newDesc,
			currentToolSlug ? [currentToolSlug] : [],
		);
		track({
			name: "tool_collection_created",
			props: { tool_slug: currentToolSlug ?? null },
		});
		toast.success(`Collection "${created.name}" created`);
		setNewName("");
		setNewDesc("");
		setShowCreateDialog(false);
	}

	function handleDelete(id: string, name: string) {
		deleteCollection(id);
		track({ name: "tool_collection_deleted", props: {} });
		toast.success(`Collection "${name}" deleted`);
	}

	function handleToggleTool(collectionId: string, inCollection: boolean) {
		if (!currentToolSlug) return;
		if (inCollection) {
			removeToolFromCollection(collectionId, currentToolSlug);
			track({
				name: "tool_collection_tool_removed",
				props: { tool_slug: currentToolSlug },
			});
		} else {
			addToolToCollection(collectionId, currentToolSlug);
			track({
				name: "tool_collection_tool_added",
				props: { tool_slug: currentToolSlug },
			});
		}
	}

	return (
		<div className={className}>
			<div className="flex items-center justify-between mb-3">
				<div className="flex items-center gap-2">
					<FolderIcon className="w-4 h-4 text-muted-foreground" />
					<span className="text-sm font-medium">Collections</span>
					{collections.length > 0 && (
						<span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
							{collections.length}
						</span>
					)}
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={() => setShowCreateDialog(true)}
					className="h-7 text-xs gap-1"
				>
					<PlusIcon className="w-3 h-3" />
					New
				</Button>
			</div>

			{collections.length === 0 ? (
				<p className="text-xs text-muted-foreground py-2">
					Group your tools into collections for quick access.
				</p>
			) : (
				<ul className="space-y-2">
					{collections.map((collection) => {
						const inCollection = currentToolSlug
							? collection.toolSlugs.includes(currentToolSlug)
							: false;
						return (
							<li
								key={collection.id}
								className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm"
							>
								<div className="flex items-center gap-2 min-w-0 flex-1">
									{inCollection ? (
										<FolderOpenIcon className="w-4 h-4 text-primary shrink-0" />
									) : (
										<FolderIcon className="w-4 h-4 text-muted-foreground shrink-0" />
									)}
									<div className="min-w-0">
										<p className="font-medium truncate">
											{collection.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{collection.toolSlugs.length}{" "}
											{collection.toolSlugs.length === 1
												? "tool"
												: "tools"}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-1 shrink-0">
									{currentToolSlug && (
										<Button
											size="sm"
											variant={
												inCollection
													? "primary"
													: "outline"
											}
											onClick={() =>
												handleToggleTool(
													collection.id,
													inCollection,
												)
											}
											className="h-6 text-xs px-2"
										>
											{inCollection ? (
												<>
													<XIcon className="w-3 h-3 mr-1" />
													Remove
												</>
											) : (
												<>
													<BookmarkIcon className="w-3 h-3 mr-1" />
													Add
												</>
											)}
										</Button>
									)}
									<Button
										size="sm"
										variant="ghost"
										onClick={() =>
											handleDelete(
												collection.id,
												collection.name,
											)
										}
										className="h-6 w-6 p-0 text-destructive hover:text-destructive"
										aria-label={`Delete ${collection.name}`}
									>
										<TrashIcon className="w-3 h-3" />
									</Button>
								</div>
							</li>
						);
					})}
				</ul>
			)}

			{/* Quick links to collection tool pages */}
			{!currentToolSlug && collections.length > 0 && (
				<div className="mt-3">
					<p className="text-xs text-muted-foreground mb-2">
						Browse by collection:
					</p>
					<div className="flex flex-wrap gap-1">
						{collections.map((collection) => (
							<Link
								key={collection.id}
								href={`/app/tools?collection=${collection.id}`}
								className="text-xs rounded-full border px-2.5 py-0.5 hover:bg-muted transition-colors"
							>
								{collection.name}
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Create dialog */}
			<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New Collection</DialogTitle>
						<DialogDescription>
							Group tools together for quick access to your common
							workflows.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 py-2">
						<Input
							placeholder="Collection name"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							onKeyDown={(e) =>
								e.key === "Enter" && handleCreate()
							}
						/>
						<Textarea
							placeholder="Optional description"
							value={newDesc}
							onChange={(e) => setNewDesc(e.target.value)}
							rows={2}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowCreateDialog(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleCreate}
							disabled={!newName.trim()}
						>
							Create Collection
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
