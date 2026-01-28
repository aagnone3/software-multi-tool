"use client";

import { cn } from "@ui/lib";
import { useEffect, useState } from "react";

interface GaugeThreshold {
	/** Value at which this threshold starts (inclusive) */
	value: number;
	/** Color for this threshold range */
	color: string;
	/** Tailwind text color class for the score display */
	textClass: string;
	/** Label to display for this range */
	label: string;
}

interface SemiCircleGaugeProps {
	/** Current value (0 to max) */
	value: number;
	/** Maximum value (default: 10) */
	max?: number;
	/** Size in pixels (default: 200) */
	size?: number;
	/** Stroke width in pixels (default: 20) */
	strokeWidth?: number;
	/** Label shown below the score */
	label?: string;
	/** Color thresholds for the gauge */
	thresholds?: GaugeThreshold[];
	/** Whether to show tick marks (default: true) */
	showTicks?: boolean;
	/** Tick positions as fractions of max (default: [0, 0.25, 0.5, 0.75, 1]) */
	tickPositions?: number[];
	/** Animation duration in ms (default: 700) */
	animationDuration?: number;
}

const DEFAULT_THRESHOLDS: GaugeThreshold[] = [
	{ value: 0, color: "#22c55e", textClass: "text-green-500", label: "Low" },
	{
		value: 4,
		color: "#eab308",
		textClass: "text-amber-500",
		label: "Medium",
	},
	{ value: 7, color: "#ef4444", textClass: "text-red-500", label: "High" },
];

export function SemiCircleGauge({
	value,
	max = 10,
	size = 200,
	strokeWidth = 20,
	label,
	thresholds = DEFAULT_THRESHOLDS,
	showTicks = true,
	tickPositions = [0, 0.25, 0.5, 0.75, 1],
	animationDuration = 700,
}: SemiCircleGaugeProps) {
	const [animatedValue, setAnimatedValue] = useState(0);

	useEffect(() => {
		const timer = setTimeout(() => setAnimatedValue(value), 100);
		return () => clearTimeout(timer);
	}, [value]);

	// SVG gauge parameters
	const radius = (size - strokeWidth) / 2;
	const centerX = size / 2;
	const centerY = size / 2;

	// Create semi-circle arc path
	const arcPath = `
		M ${centerX - radius} ${centerY}
		A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}
	`;

	// Get threshold info for current value
	const getThresholdInfo = (val: number) => {
		// Find the highest threshold that the value exceeds
		const sorted = [...thresholds].sort((a, b) => b.value - a.value);
		return (
			sorted.find((t) => val >= t.value) ||
			thresholds[0] || {
				color: "#22c55e",
				textClass: "text-green-500",
				label: "",
			}
		);
	};

	const currentThreshold = getThresholdInfo(value);

	// Build gradient stops from thresholds
	const gradientStops = thresholds.map((t) => {
		const stopPercent = (t.value / max) * 100;
		return (
			<stop
				key={t.value}
				offset={`${stopPercent}%`}
				stopColor={t.color}
			/>
		);
	});

	// Add final stop at 100%
	const lastThreshold = thresholds[thresholds.length - 1];
	if (lastThreshold) {
		gradientStops.push(
			<stop key="end" offset="100%" stopColor={lastThreshold.color} />,
		);
	}

	return (
		<div className="flex flex-col items-center">
			<div style={{ width: size, height: size / 2 + 10 }}>
				<svg
					width={size}
					height={size / 2 + 10}
					viewBox={`0 0 ${size} ${size / 2 + 10}`}
					role="img"
					aria-label={`Gauge showing ${value} out of ${max}`}
				>
					<title>
						{label ? `${label}: ` : ""}
						{value}/{max}
					</title>

					{/* Gradient definition */}
					<defs>
						<linearGradient
							id={`gaugeGradient-${size}`}
							x1="0%"
							y1="0%"
							x2="100%"
							y2="0%"
						>
							{gradientStops}
						</linearGradient>
					</defs>

					{/* Track background */}
					<path
						d={arcPath}
						fill="none"
						stroke="currentColor"
						strokeWidth={strokeWidth}
						className="text-muted/30"
						strokeLinecap="round"
					/>

					{/* Colored progress arc */}
					<path
						d={arcPath}
						fill="none"
						stroke={`url(#gaugeGradient-${size})`}
						strokeWidth={strokeWidth}
						strokeLinecap="round"
						strokeDasharray={`${(animatedValue / max) * Math.PI * radius} ${Math.PI * radius}`}
						style={{
							transition: `stroke-dasharray ${animationDuration}ms ease-out`,
						}}
					/>

					{/* Tick marks */}
					{showTicks &&
						tickPositions.map((tickFraction) => {
							const tickAngle = Math.PI - tickFraction * Math.PI;
							const innerRadius = radius - strokeWidth / 2 - 5;
							const outerRadius = radius - strokeWidth / 2 - 15;
							const x1 =
								centerX + Math.cos(tickAngle) * innerRadius;
							const y1 =
								centerY - Math.sin(tickAngle) * innerRadius;
							const x2 =
								centerX + Math.cos(tickAngle) * outerRadius;
							const y2 =
								centerY - Math.sin(tickAngle) * outerRadius;
							return (
								<line
									key={tickFraction}
									x1={x1}
									y1={y1}
									x2={x2}
									y2={y2}
									stroke="currentColor"
									strokeWidth="2"
									className="text-muted-foreground/50"
								/>
							);
						})}
				</svg>
			</div>

			{/* Score display */}
			<div className="-mt-2 text-center">
				<span
					className={cn(
						"text-4xl font-bold tabular-nums",
						currentThreshold.textClass,
					)}
				>
					{value}
				</span>
				<span className="text-lg text-muted-foreground">/{max}</span>
			</div>

			{label && (
				<p className="mt-1 text-sm text-muted-foreground">{label}</p>
			)}
			{currentThreshold.label && (
				<p className="text-xs text-muted-foreground/75">
					{currentThreshold.label}
				</p>
			)}
		</div>
	);
}
