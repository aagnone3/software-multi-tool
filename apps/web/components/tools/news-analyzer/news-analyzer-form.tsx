"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { cn } from "@ui/lib";
import { FileText, Link2 } from "lucide-react";
import { useState } from "react";

export interface NewsAnalyzerFormProps {
	onSubmit: (data: { articleUrl?: string; articleText?: string }) => void;
	isLoading: boolean;
}

export function NewsAnalyzerForm({
	onSubmit,
	isLoading,
}: NewsAnalyzerFormProps) {
	const [inputMode, setInputMode] = useState<"url" | "text">("url");
	const [articleUrl, setArticleUrl] = useState("");
	const [articleText, setArticleText] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		if (inputMode === "url" && articleUrl.trim()) {
			onSubmit({ articleUrl: articleUrl.trim() });
		} else if (inputMode === "text" && articleText.trim()) {
			onSubmit({ articleText: articleText.trim() });
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Segmented Mode Switcher */}
			<div className="rounded-lg bg-muted p-1 inline-flex">
				<button
					type="button"
					onClick={() => setInputMode("url")}
					className={cn(
						"inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
						inputMode === "url"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<Link2 className="size-4" />
					URL
				</button>
				<button
					type="button"
					onClick={() => setInputMode("text")}
					className={cn(
						"inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
						inputMode === "text"
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					<FileText className="size-4" />
					Paste Text
				</button>
			</div>

			{inputMode === "url" ? (
				<div className="space-y-2">
					<Label htmlFor="articleUrl">Article URL</Label>
					<Input
						id="articleUrl"
						type="url"
						placeholder="https://example.com/article"
						value={articleUrl}
						onChange={(e) => setArticleUrl(e.target.value)}
						required
						disabled={isLoading}
					/>
					<p className="text-sm text-muted-foreground">
						Enter the URL of a news article to analyze for bias,
						sentiment, and key information.
					</p>
				</div>
			) : (
				<div className="space-y-2">
					<Label htmlFor="articleText">Article Text</Label>
					<Textarea
						id="articleText"
						placeholder="Paste the article text here..."
						value={articleText}
						onChange={(e) => setArticleText(e.target.value)}
						required
						disabled={isLoading}
						rows={10}
						className="resize-y"
					/>
					<div className="flex items-center justify-between">
						<p className="text-sm text-muted-foreground">
							Paste the full text of the article you want to
							analyze.
						</p>
						<p
							className={cn(
								"text-sm tabular-nums",
								articleText.length < 100
									? "text-amber-500"
									: "text-muted-foreground",
							)}
						>
							{articleText.length.toLocaleString()} characters
							{articleText.length < 100 &&
								articleText.length > 0 && (
									<span className="ml-1 text-xs">
										(min 100 recommended)
									</span>
								)}
						</p>
					</div>
				</div>
			)}

			<Button type="submit" disabled={isLoading} className="w-full">
				{isLoading ? "Analyzing..." : "Analyze Article"}
			</Button>
		</form>
	);
}
