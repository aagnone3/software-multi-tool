"use client";

import { Button } from "@ui/components/button";
import { Label } from "@ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Textarea } from "@ui/components/textarea";
import { RotateCcw } from "lucide-react";
import {
	DEFAULT_DIAGRAM_TYPE,
	DIAGRAM_TYPE_LABELS,
	type DiagramType,
	SAMPLE_DIAGRAMS,
} from "./lib/sample-diagrams";

interface DiagramEditorInputProps {
	value: string;
	onChange: (value: string) => void;
	selectedType: DiagramType;
	onTypeChange: (type: DiagramType) => void;
}

export function DiagramEditorInput({
	value,
	onChange,
	selectedType,
	onTypeChange,
}: DiagramEditorInputProps) {
	const handleReset = () => {
		onChange(SAMPLE_DIAGRAMS[selectedType]);
	};

	const handleTypeChange = (type: string) => {
		const diagramType = type as DiagramType;
		onTypeChange(diagramType);
		onChange(SAMPLE_DIAGRAMS[diagramType]);
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-4">
				<div className="flex-1">
					<Label htmlFor="diagram-type">Diagram Type</Label>
					<Select
						value={selectedType}
						onValueChange={handleTypeChange}
					>
						<SelectTrigger id="diagram-type" className="mt-1.5">
							<SelectValue placeholder="Select diagram type" />
						</SelectTrigger>
						<SelectContent>
							{(
								Object.entries(DIAGRAM_TYPE_LABELS) as [
									DiagramType,
									string,
								][]
							).map(([key, label]) => (
								<SelectItem key={key} value={key}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-end">
					<Button
						variant="outline"
						size="sm"
						onClick={handleReset}
						className="gap-2"
					>
						<RotateCcw className="h-4 w-4" />
						Reset
					</Button>
				</div>
			</div>

			<div>
				<Label htmlFor="diagram-code">Mermaid Syntax</Label>
				<Textarea
					id="diagram-code"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="Enter Mermaid diagram syntax..."
					className="mt-1.5 min-h-[300px] font-mono text-sm"
					spellCheck={false}
				/>
			</div>

			<p className="text-xs text-muted-foreground">
				Learn more about Mermaid syntax at{" "}
				<a
					href="https://mermaid.js.org/intro/"
					target="_blank"
					rel="noopener noreferrer"
					className="text-primary underline-offset-4 hover:underline"
				>
					mermaid.js.org
				</a>
			</p>
		</div>
	);
}

export { DEFAULT_DIAGRAM_TYPE, SAMPLE_DIAGRAMS };
