"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
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
			<div className="flex gap-2 border-b">
				<button
					type="button"
					onClick={() => setInputMode("url")}
					className={`px-4 py-2 font-medium ${
						inputMode === "url"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground"
					}`}
				>
					URL
				</button>
				<button
					type="button"
					onClick={() => setInputMode("text")}
					className={`px-4 py-2 font-medium ${
						inputMode === "text"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground"
					}`}
				>
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
					<p className="text-sm text-muted-foreground">
						Paste the full text of the article you want to analyze.
					</p>
				</div>
			)}

			<Button type="submit" disabled={isLoading} className="w-full">
				{isLoading ? "Analyzing..." : "Analyze Article"}
			</Button>
		</form>
	);
}
