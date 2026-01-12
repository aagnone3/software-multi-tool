"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";

interface BiasAnalysis {
	politicalLean: string;
	sensationalism: number;
	factualRating: string;
}

interface EntitiesAnalysis {
	people: string[];
	organizations: string[];
	places: string[];
}

export interface NewsAnalysisOutput {
	summary: string[];
	bias: BiasAnalysis;
	entities: EntitiesAnalysis;
	sentiment: string;
	sourceCredibility?: string;
	relatedContext?: string[];
}

export interface NewsAnalyzerResultsProps {
	output: NewsAnalysisOutput;
}

function BiasIndicator({ lean }: { lean: string }) {
	const position =
		lean === "Left"
			? 10
			: lean === "Center-Left"
				? 30
				: lean === "Center"
					? 50
					: lean === "Center-Right"
						? 70
						: 90;

	return (
		<div className="space-y-2">
			<div className="flex justify-between text-sm text-muted-foreground">
				<span>Left</span>
				<span>Center</span>
				<span>Right</span>
			</div>
			<div className="relative h-2 rounded-full bg-gradient-to-r from-blue-500 via-gray-300 to-red-500">
				<div
					className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-lg"
					style={{ left: `${position}%` }}
				/>
			</div>
			<p className="text-sm font-medium">{lean}</p>
		</div>
	);
}

function SensationalismMeter({ score }: { score: number }) {
	const percentage = (score / 10) * 100;

	return (
		<div className="space-y-2">
			<div className="flex justify-between">
				<span className="text-sm font-medium">
					Sensationalism Score
				</span>
				<span className="text-sm font-bold">{score}/10</span>
			</div>
			<div className="h-2 rounded-full bg-gray-200">
				<div
					className="h-full rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}

export function NewsAnalyzerResults({ output }: NewsAnalyzerResultsProps) {
	return (
		<div className="space-y-6">
			<Tabs defaultValue="summary" className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="summary">Summary</TabsTrigger>
					<TabsTrigger value="bias">Bias</TabsTrigger>
					<TabsTrigger value="entities">Entities</TabsTrigger>
					<TabsTrigger value="details">Details</TabsTrigger>
				</TabsList>

				<TabsContent value="summary" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Article Summary</CardTitle>
							<CardDescription>
								Key points from the article
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="list-disc space-y-2 pl-5">
								{output.summary.map((point, index) => (
									<li key={index} className="text-sm">
										{point}
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="bias" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Bias Analysis</CardTitle>
							<CardDescription>
								Political lean and factual assessment
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div>
								<h3 className="mb-4 text-sm font-medium">
									Political Lean
								</h3>
								<BiasIndicator
									lean={output.bias.politicalLean}
								/>
							</div>

							<div>
								<SensationalismMeter
									score={output.bias.sensationalism}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-sm font-medium text-muted-foreground">
										Factual Rating
									</p>
									<p className="text-lg font-bold">
										{output.bias.factualRating}
									</p>
								</div>
								{output.sourceCredibility && (
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Source Credibility
										</p>
										<p className="text-lg font-bold">
											{output.sourceCredibility}
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="entities" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle>People</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-1">
									{output.entities.people.length > 0 ? (
										output.entities.people.map(
											(person, index) => (
												<li
													key={index}
													className="text-sm"
												>
													{person}
												</li>
											),
										)
									) : (
										<li className="text-sm text-muted-foreground">
											None identified
										</li>
									)}
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Organizations</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-1">
									{output.entities.organizations.length >
									0 ? (
										output.entities.organizations.map(
											(org, index) => (
												<li
													key={index}
													className="text-sm"
												>
													{org}
												</li>
											),
										)
									) : (
										<li className="text-sm text-muted-foreground">
											None identified
										</li>
									)}
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Places</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-1">
									{output.entities.places.length > 0 ? (
										output.entities.places.map(
											(place, index) => (
												<li
													key={index}
													className="text-sm"
												>
													{place}
												</li>
											),
										)
									) : (
										<li className="text-sm text-muted-foreground">
											None identified
										</li>
									)}
								</ul>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="details" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Additional Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<p className="text-sm font-medium text-muted-foreground">
									Overall Sentiment
								</p>
								<p className="text-lg font-bold">
									{output.sentiment}
								</p>
							</div>

							{output.relatedContext &&
								output.relatedContext.length > 0 && (
									<div>
										<p className="mb-2 text-sm font-medium text-muted-foreground">
											Related Context
										</p>
										<ul className="list-disc space-y-1 pl-5">
											{output.relatedContext.map(
												(context, index) => (
													<li
														key={index}
														className="text-sm"
													>
														{context}
													</li>
												),
											)}
										</ul>
									</div>
								)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
