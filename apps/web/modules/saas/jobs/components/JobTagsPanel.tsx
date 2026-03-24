"use client";

import { useJobTags } from "@tools/hooks/use-job-tags";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { TagIcon, XIcon } from "lucide-react";
import React, { useState } from "react";

interface JobTagsPanelProps {
	jobId: string;
	className?: string;
}

export function JobTagsPanel({ jobId, className }: JobTagsPanelProps) {
	const { tags, addTag, removeTag } = useJobTags(jobId);
	const [inputValue, setInputValue] = useState("");

	const handleAdd = () => {
		const trimmed = inputValue.trim();
		if (!trimmed) {
			return;
		}
		addTag(trimmed);
		setInputValue("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleAdd();
		}
	};

	return (
		<div className={className}>
			<h3 className="font-semibold flex items-center gap-2 mb-3 text-sm">
				<TagIcon className="h-4 w-4" />
				Tags
			</h3>

			<div className="flex flex-wrap gap-1.5 mb-3 min-h-[28px]">
				{tags.length === 0 && (
					<p className="text-xs text-muted-foreground">No tags yet</p>
				)}
				{tags.map((tag) => (
					<Badge key={tag} className="flex items-center gap-1 pr-1">
						{tag}
						<button
							type="button"
							aria-label={`Remove tag ${tag}`}
							onClick={() => removeTag(tag)}
							className="ml-0.5 hover:text-destructive"
						>
							<XIcon className="h-3 w-3" />
						</button>
					</Badge>
				))}
			</div>

			<div className="flex gap-2">
				<Input
					value={inputValue}
					onChange={(e) => setInputValue(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Add tag..."
					className="h-8 text-sm"
					aria-label="New tag"
				/>
				<Button
					type="button"
					size="sm"
					variant="outline"
					onClick={handleAdd}
					disabled={!inputValue.trim()}
				>
					Add
				</Button>
			</div>
		</div>
	);
}
