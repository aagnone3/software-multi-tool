"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { BellIcon, BellOffIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "credit-alert-settings";

interface AlertSettings {
	enabled: boolean;
	threshold: number;
}

const DEFAULT_SETTINGS: AlertSettings = {
	enabled: true,
	threshold: 100,
};

function loadSettings(): AlertSettings {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as Partial<AlertSettings>;
			return {
				enabled: parsed.enabled ?? DEFAULT_SETTINGS.enabled,
				threshold:
					typeof parsed.threshold === "number" && parsed.threshold > 0
						? parsed.threshold
						: DEFAULT_SETTINGS.threshold,
			};
		}
	} catch {
		// ignore
	}
	return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: AlertSettings): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface CreditAlertSettingsProps {
	className?: string;
}

export function CreditAlertSettings({ className }: CreditAlertSettingsProps) {
	const [settings, setSettings] = useState<AlertSettings>(DEFAULT_SETTINGS);
	const [inputValue, setInputValue] = useState(
		String(DEFAULT_SETTINGS.threshold),
	);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		const loaded = loadSettings();
		setSettings(loaded);
		setInputValue(String(loaded.threshold));
		setMounted(true);
	}, []);

	const handleToggle = (enabled: boolean) => {
		const next = { ...settings, enabled };
		setSettings(next);
		saveSettings(next);
		toast.success(
			enabled
				? "Low credits alert enabled"
				: "Low credits alert disabled",
		);
	};

	const handleSaveThreshold = () => {
		const value = Number.parseInt(inputValue, 10);
		if (isNaN(value) || value <= 0) {
			toast.error("Please enter a valid threshold (positive number)");
			return;
		}
		const next = { ...settings, threshold: value };
		setSettings(next);
		saveSettings(next);
		toast.success(`Alert threshold set to ${value} credits`);
	};

	if (!mounted) {
		return null;
	}

	return (
		<div className={className}>
			<div className="flex items-start gap-4 justify-between">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						{settings.enabled ? (
							<BellIcon className="size-4 text-amber-500" />
						) : (
							<BellOffIcon className="size-4 text-muted-foreground" />
						)}
						<Label
							htmlFor="credit-alert-toggle"
							className="font-medium"
						>
							Low credits alert
						</Label>
					</div>
					<p className="text-sm text-muted-foreground">
						Show a warning when your credit balance falls below the
						threshold.
					</p>
				</div>
				<Switch
					id="credit-alert-toggle"
					checked={settings.enabled}
					onCheckedChange={handleToggle}
				/>
			</div>

			{settings.enabled && (
				<div className="mt-4 space-y-2">
					<Label htmlFor="credit-threshold">
						Alert threshold (credits)
					</Label>
					<div className="flex items-center gap-2">
						<Input
							id="credit-threshold"
							type="number"
							min={1}
							value={inputValue}
							onChange={(e) => setInputValue(e.target.value)}
							className="w-32"
							placeholder="100"
						/>
						<Button
							size="sm"
							variant="outline"
							onClick={handleSaveThreshold}
						>
							Save
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						You will see a warning banner when your balance drops
						below {settings.threshold} credits.
					</p>
				</div>
			)}
		</div>
	);
}
