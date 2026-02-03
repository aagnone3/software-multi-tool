"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { GitBranch } from "lucide-react";
import { useRef, useState } from "react";
import {
	DEFAULT_DIAGRAM_TYPE,
	DiagramEditorInput,
	SAMPLE_DIAGRAMS,
} from "./diagram-editor-input";
import { DiagramExport } from "./diagram-export";
import { DiagramPreview } from "./diagram-preview";
import type { DiagramType } from "./lib/sample-diagrams";
import { useDebounce } from "./lib/use-debounce";

const DEBOUNCE_DELAY_MS = 300;

export function DiagramEditor() {
	const [selectedType, setSelectedType] =
		useState<DiagramType>(DEFAULT_DIAGRAM_TYPE);
	const [code, setCode] = useState<string>(
		SAMPLE_DIAGRAMS[DEFAULT_DIAGRAM_TYPE],
	);
	const debouncedCode = useDebounce(code, DEBOUNCE_DELAY_MS);
	const previewRef = useRef<HTMLDivElement>(null);

	const hasValidCode = debouncedCode.trim().length > 0;

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
							<GitBranch className="h-5 w-5 text-primary" />
						</div>
						<div>
							<CardTitle className="text-xl">
								Diagram Editor
							</CardTitle>
							<p className="text-sm text-muted-foreground">
								Create diagrams with Mermaid syntax
							</p>
						</div>
					</div>
					<DiagramExport
						containerRef={previewRef}
						disabled={!hasValidCode}
					/>
				</CardHeader>
				<CardContent>
					<div className="grid gap-6 lg:grid-cols-2">
						<div>
							<DiagramEditorInput
								value={code}
								onChange={setCode}
								selectedType={selectedType}
								onTypeChange={setSelectedType}
							/>
						</div>
						<div>
							<div className="mb-1.5">
								<span className="text-sm font-medium">
									Preview
								</span>
							</div>
							<DiagramPreview
								ref={previewRef}
								code={debouncedCode}
								className="min-h-[350px]"
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
