"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
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
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { cn } from "@ui/lib";
import {
	BookmarkIcon,
	ClipboardIcon,
	PlusIcon,
	Trash2Icon,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "tool-input-templates";

interface InputTemplate {
	id: string;
	name: string;
	content: string;
	createdAt: number;
}

type TemplateMap = Record<string, InputTemplate[]>; // toolSlug → templates

function loadTemplates(): TemplateMap {
	if (typeof window === "undefined") return {};
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
	} catch {
		return {};
	}
}

function saveTemplates(map: TemplateMap) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function generateId() {
	return `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface ToolInputTemplatesProps {
	toolSlug: string;
	className?: string;
}

export function ToolInputTemplates({
	toolSlug,
	className,
}: ToolInputTemplatesProps) {
	const { track } = useProductAnalytics();
	const [templateMap, setTemplateMap] = useState<TemplateMap>({});
	const [dialogOpen, setDialogOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newContent, setNewContent] = useState("");

	useEffect(() => {
		setTemplateMap(loadTemplates());
	}, []);

	const templates: InputTemplate[] = templateMap[toolSlug] ?? [];

	const addTemplate = useCallback(() => {
		const name = newName.trim();
		const content = newContent.trim();
		if (!name || !content) return;

		const template: InputTemplate = {
			id: generateId(),
			name,
			content,
			createdAt: Date.now(),
		};

		setTemplateMap((prev) => {
			const existing = prev[toolSlug] ?? [];
			const next = { ...prev, [toolSlug]: [...existing, template] };
			saveTemplates(next);
			return next;
		});

		setNewName("");
		setNewContent("");
		setDialogOpen(false);
		toast.success(`Template "${name}" saved`);
		track({
			name: "tool_template_saved",
			props: { tool_slug: toolSlug, template_name: name },
		});
	}, [toolSlug, newName, newContent, track]);

	const deleteTemplate = useCallback(
		(id: string, name: string) => {
			setTemplateMap((prev) => {
				const existing = prev[toolSlug] ?? [];
				const next = {
					...prev,
					[toolSlug]: existing.filter((t) => t.id !== id),
				};
				saveTemplates(next);
				return next;
			});
			toast.success("Template deleted");
			track({
				name: "tool_template_deleted",
				props: { tool_slug: toolSlug, template_name: name },
			});
		},
		[toolSlug, track],
	);

	const copyTemplate = useCallback(
		(content: string, name: string) => {
			track({
				name: "tool_template_applied",
				props: { tool_slug: toolSlug, template_name: name },
			});
			navigator.clipboard
				.writeText(content)
				.then(() => {
					toast.success(`"${name}" copied to clipboard`);
				})
				.catch(() => {
					toast.error("Failed to copy to clipboard");
				});
		},
		[toolSlug, track],
	);

	return (
		<Card className={cn(className)}>
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<div>
					<CardTitle className="text-base flex items-center gap-2">
						<BookmarkIcon className="size-4" />
						Input Templates
					</CardTitle>
					<CardDescription className="text-sm mt-1">
						Save reusable inputs for this tool
					</CardDescription>
				</div>
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" size="sm" className="gap-1">
							<PlusIcon className="size-4" />
							New
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Save Input Template</DialogTitle>
						</DialogHeader>
						<div className="space-y-4 py-2">
							<div className="space-y-1">
								<Label htmlFor="template-name">
									Template Name
								</Label>
								<Input
									id="template-name"
									placeholder="e.g. Monthly expense report"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="template-content">
									Template Content
								</Label>
								<Textarea
									id="template-content"
									placeholder="Paste or type your input template here..."
									value={newContent}
									onChange={(e) =>
										setNewContent(e.target.value)
									}
									rows={6}
								/>
							</div>
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setDialogOpen(false)}
							>
								Cancel
							</Button>
							<Button
								onClick={addTemplate}
								disabled={!newName.trim() || !newContent.trim()}
							>
								Save Template
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</CardHeader>
			<CardContent>
				{templates.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-4">
						No templates yet. Save commonly used inputs to reuse
						them later.
					</p>
				) : (
					<ul className="space-y-2">
						{templates.map((tpl) => (
							<li
								key={tpl.id}
								className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 bg-muted/30"
							>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium truncate">
										{tpl.name}
									</p>
									<p className="text-xs text-muted-foreground truncate mt-0.5">
										{tpl.content.slice(0, 80)}
										{tpl.content.length > 80 ? "…" : ""}
									</p>
								</div>
								<div className="flex items-center gap-1 shrink-0">
									<Button
										variant="ghost"
										size="icon"
										className="size-7"
										onClick={() =>
											copyTemplate(tpl.content, tpl.name)
										}
										title="Copy to clipboard"
									>
										<ClipboardIcon className="size-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="size-7 text-destructive hover:text-destructive"
										onClick={() =>
											deleteTemplate(tpl.id, tpl.name)
										}
										title="Delete template"
									>
										<Trash2Icon className="size-3.5" />
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
