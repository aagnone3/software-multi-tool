"use client";

import { SemiCircleGauge } from "@shared/components/SemiCircleGauge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@ui/components/tooltip";
import { cn } from "@ui/lib";
import {
	AlertTriangle,
	Building2,
	CheckCircle2,
	FileText,
	Frown,
	Info,
	ListChecks,
	MapPin,
	Meh,
	Scale,
	Smile,
	User,
	Users,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

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

export interface ArticleMetadata {
	title?: string;
	ogImage?: string | null;
	siteName?: string | null;
	byline?: string | null;
}

export interface NewsAnalysisOutput {
	summary: string[];
	bias: BiasAnalysis;
	entities: EntitiesAnalysis;
	sentiment: string;
	sourceCredibility?: string;
	relatedContext?: string[];
	articleMetadata?: ArticleMetadata;
}

export interface NewsAnalyzerResultsProps {
	output: NewsAnalysisOutput;
}

const POLITICAL_LEAN_POSITIONS: Record<string, number> = {
	Left: 0,
	"Center-Left": 25,
	Center: 50,
	"Center-Right": 75,
	Right: 100,
};

const POLITICAL_LEAN_LABELS = [
	"Left",
	"Center-Left",
	"Center",
	"Center-Right",
	"Right",
];

function PoliticalLeanSpectrum({ lean }: { lean: string }) {
	const [animated, setAnimated] = useState(false);
	const position = POLITICAL_LEAN_POSITIONS[lean] ?? 50;

	useEffect(() => {
		const timer = setTimeout(() => setAnimated(true), 100);
		return () => clearTimeout(timer);
	}, []);

	return (
		<TooltipProvider>
			<div className="space-y-3">
				{/* Spectrum bar with tick marks */}
				<div className="relative">
					<div className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-gray-300 to-red-500" />
					{/* Indicator dot */}
					<div
						className={cn(
							"absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-700 ease-out",
							animated ? "opacity-100" : "opacity-0",
						)}
						style={{ left: `${position}%` }}
					>
						<Tooltip>
							<TooltipTrigger asChild>
								<div className="relative">
									<div className="h-5 w-5 rounded-full border-2 border-white bg-primary shadow-lg motion-safe:animate-pulse" />
									<div className="absolute inset-0 rounded-full bg-primary/20 motion-safe:animate-ping" />
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p className="text-sm">
									Political lean is determined by analyzing
									language patterns, source attribution, and
									framing of issues.
								</p>
							</TooltipContent>
						</Tooltip>
					</div>
				</div>
				{/* Labels */}
				<div className="flex justify-between text-xs text-muted-foreground">
					{POLITICAL_LEAN_LABELS.map((label) => (
						<span
							key={label}
							className={cn(
								"transition-colors duration-300",
								label === lean &&
									"font-semibold text-foreground",
							)}
						>
							{label}
						</span>
					))}
				</div>
				{/* Current value badge */}
				<div className="flex justify-center">
					<span className="rounded-full border px-3 py-1 text-sm font-medium">
						{lean}
					</span>
				</div>
			</div>
		</TooltipProvider>
	);
}

const SENSATIONALISM_THRESHOLDS = [
	{
		value: 0,
		color: "#22c55e",
		textClass: "text-green-500",
		label: "Low - Factual reporting",
	},
	{
		value: 4,
		color: "#eab308",
		textClass: "text-amber-500",
		label: "Moderate - Some bias",
	},
	{
		value: 7,
		color: "#ef4444",
		textClass: "text-red-500",
		label: "High - Sensationalized",
	},
];

function FactualRatingBadge({ rating }: { rating: string }) {
	const normalizedRating = rating.toLowerCase();

	if (normalizedRating.includes("high")) {
		return (
			<div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-green-600 dark:text-green-400">
				<CheckCircle2 className="size-4" />
				<span className="text-sm font-medium">{rating}</span>
			</div>
		);
	}

	if (
		normalizedRating.includes("medium") ||
		normalizedRating.includes("mixed")
	) {
		return (
			<div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-amber-600 dark:text-amber-400">
				<AlertTriangle className="size-4" />
				<span className="text-sm font-medium">{rating}</span>
			</div>
		);
	}

	return (
		<div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 text-red-600 dark:text-red-400">
			<XCircle className="size-4" />
			<span className="text-sm font-medium">{rating}</span>
		</div>
	);
}

function SentimentIndicator({ sentiment }: { sentiment: string }) {
	const normalizedSentiment = sentiment.toLowerCase();

	const getIconAndColor = () => {
		if (normalizedSentiment.includes("positive")) {
			return {
				Icon: Smile,
				colorClass: "text-green-600 dark:text-green-400",
			};
		}
		if (normalizedSentiment.includes("negative")) {
			return {
				Icon: Frown,
				colorClass: "text-red-600 dark:text-red-400",
			};
		}
		return {
			Icon: Meh,
			colorClass: "text-gray-600 dark:text-gray-400",
		};
	};

	const { Icon, colorClass } = getIconAndColor();

	return (
		<div>
			<Icon className={cn("mx-auto mb-2 size-6", colorClass)} />
			<p className="text-xs text-muted-foreground">Overall tone</p>
			<p className="mt-1 font-semibold">{sentiment}</p>
		</div>
	);
}

function SummaryCard({ point, index }: { point: string; index: number }) {
	const delays = [
		"delay-0",
		"delay-75",
		"delay-100",
		"delay-150",
		"delay-200",
	];
	const delay = delays[Math.min(index, delays.length - 1)];

	return (
		<div
			className={cn(
				"flex gap-3 rounded-lg border bg-card p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300",
				delay,
			)}
		>
			<div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
				{index + 1}
			</div>
			<p className="text-sm leading-relaxed">{point}</p>
		</div>
	);
}

function EntityBadge({
	type,
	name,
}: {
	type: "person" | "organization" | "place";
	name: string;
}) {
	const icons = {
		person: User,
		organization: Building2,
		place: MapPin,
	};
	const Icon = icons[type];

	return (
		<span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
			<Icon className="size-3" />
			{name}
		</span>
	);
}

export function NewsAnalyzerResults({ output }: NewsAnalyzerResultsProps) {
	const entityCount =
		output.entities.people.length +
		output.entities.organizations.length +
		output.entities.places.length;

	return (
		<div className="space-y-6">
			{/* Metrics Hero Section */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="text-center">
					<CardContent className="pt-6">
						<Scale className="mx-auto mb-2 size-6 text-muted-foreground" />
						<p className="text-xs text-muted-foreground">
							Political Lean
						</p>
						<p className="mt-1 font-semibold">
							{output.bias.politicalLean}
						</p>
					</CardContent>
				</Card>
				<Card className="text-center">
					<CardContent className="pt-6">
						<SentimentIndicator sentiment={output.sentiment} />
					</CardContent>
				</Card>
				<Card className="text-center">
					<CardContent className="pt-6">
						<Info className="mx-auto mb-2 size-6 text-muted-foreground" />
						<p className="text-xs text-muted-foreground">
							Factual Rating
						</p>
						<div className="mt-2">
							<FactualRatingBadge
								rating={output.bias.factualRating}
							/>
						</div>
					</CardContent>
				</Card>
				<Card className="text-center">
					<CardContent className="pt-6">
						<AlertTriangle className="mx-auto mb-2 size-6 text-muted-foreground" />
						<p className="text-xs text-muted-foreground">
							Sensationalism
						</p>
						<p
							className={cn(
								"mt-1 text-2xl font-bold tabular-nums",
								output.bias.sensationalism <= 3
									? "text-green-500"
									: output.bias.sensationalism <= 6
										? "text-amber-500"
										: "text-red-500",
							)}
						>
							{output.bias.sensationalism}/10
						</p>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="summary" className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="summary" className="gap-2">
						<ListChecks className="size-4 hidden sm:inline" />
						Summary
						<span className="ml-1 hidden rounded-full bg-muted px-2 py-0.5 text-xs font-medium sm:inline-flex">
							{output.summary.length}
						</span>
					</TabsTrigger>
					<TabsTrigger value="bias" className="gap-2">
						<Scale className="size-4 hidden sm:inline" />
						Bias
					</TabsTrigger>
					<TabsTrigger value="entities" className="gap-2">
						<Users className="size-4 hidden sm:inline" />
						Entities
						<span className="ml-1 hidden rounded-full bg-muted px-2 py-0.5 text-xs font-medium sm:inline-flex">
							{entityCount}
						</span>
					</TabsTrigger>
					<TabsTrigger value="details" className="gap-2">
						<FileText className="size-4 hidden sm:inline" />
						Details
					</TabsTrigger>
				</TabsList>

				<TabsContent
					value="summary"
					className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
				>
					<Card>
						<CardHeader>
							<CardTitle>Article Summary</CardTitle>
							<CardDescription>
								Key points from the article
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{output.summary.map((point, index) => (
								<SummaryCard
									key={index}
									point={point}
									index={index}
								/>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent
					value="bias"
					className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
				>
					<Card>
						<CardHeader>
							<CardTitle>Bias Analysis</CardTitle>
							<CardDescription>
								Political lean and factual assessment
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-8">
							<div>
								<h3 className="mb-4 text-sm font-medium">
									Political Lean
								</h3>
								<PoliticalLeanSpectrum
									lean={output.bias.politicalLean}
								/>
							</div>

							<div className="flex justify-center">
								<SemiCircleGauge
									value={output.bias.sensationalism}
									max={10}
									label="Sensationalism Score"
									thresholds={SENSATIONALISM_THRESHOLDS}
								/>
							</div>

							<div className="grid gap-6 sm:grid-cols-2">
								<div>
									<p className="text-sm font-medium text-muted-foreground mb-2">
										Factual Rating
									</p>
									<FactualRatingBadge
										rating={output.bias.factualRating}
									/>
								</div>
								{output.sourceCredibility && (
									<div>
										<p className="text-sm font-medium text-muted-foreground mb-2">
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

				<TabsContent
					value="entities"
					className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
				>
					<div className="grid gap-4 md:grid-cols-3">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base">
									<User className="size-4" />
									People
									<span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
										{output.entities.people.length}
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								{output.entities.people.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{output.entities.people.map(
											(person, index) => (
												<EntityBadge
													key={index}
													type="person"
													name={person}
												/>
											),
										)}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										None identified
									</p>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base">
									<Building2 className="size-4" />
									Organizations
									<span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
										{output.entities.organizations.length}
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								{output.entities.organizations.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{output.entities.organizations.map(
											(org, index) => (
												<EntityBadge
													key={index}
													type="organization"
													name={org}
												/>
											),
										)}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										None identified
									</p>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center gap-2 text-base">
									<MapPin className="size-4" />
									Places
									<span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
										{output.entities.places.length}
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent>
								{output.entities.places.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{output.entities.places.map(
											(place, index) => (
												<EntityBadge
													key={index}
													type="place"
													name={place}
												/>
											),
										)}
									</div>
								) : (
									<p className="text-sm text-muted-foreground">
										None identified
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent
					value="details"
					className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200"
				>
					<Card>
						<CardHeader>
							<CardTitle>Additional Details</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div>
								<p className="text-sm font-medium text-muted-foreground mb-2">
									Overall Sentiment
								</p>
								<SentimentIndicator
									sentiment={output.sentiment}
								/>
							</div>

							{output.relatedContext &&
								output.relatedContext.length > 0 && (
									<div>
										<p className="mb-3 text-sm font-medium text-muted-foreground">
											Related Context
										</p>
										<div className="space-y-2">
											{output.relatedContext.map(
												(context, index) => (
													<div
														key={index}
														className="flex gap-2 rounded-lg border border-dashed bg-muted/50 p-3"
													>
														<Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
														<p className="text-sm">
															{context}
														</p>
													</div>
												),
											)}
										</div>
									</div>
								)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
