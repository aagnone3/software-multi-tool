"use client";

import React, { useEffect } from "react";
import { useCommandPalette } from "./CommandPaletteProvider";

export function CommandPaletteShortcut() {
	const { toggle } = useCommandPalette();

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Cmd+K (Mac) or Ctrl+K (Windows/Linux)
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				toggle();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [toggle]);

	return null;
}
