"use client";

import React, {
	createContext,
	type PropsWithChildren,
	useContext,
	useState,
} from "react";
import { CommandPalette } from "./CommandPalette";

interface CommandPaletteContextValue {
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
}

const CommandPaletteContext = createContext<
	CommandPaletteContextValue | undefined
>(undefined);

export function useCommandPalette() {
	const context = useContext(CommandPaletteContext);
	if (!context) {
		throw new Error(
			"useCommandPalette must be used within a CommandPaletteProvider",
		);
	}
	return context;
}

export function CommandPaletteProvider({ children }: PropsWithChildren) {
	const [isOpen, setIsOpen] = useState(false);

	const value: CommandPaletteContextValue = {
		isOpen,
		open: () => setIsOpen(true),
		close: () => setIsOpen(false),
		toggle: () => setIsOpen((prev) => !prev),
	};

	return (
		<CommandPaletteContext.Provider value={value}>
			{children}
			<CommandPalette isOpen={isOpen} onClose={value.close} />
		</CommandPaletteContext.Provider>
	);
}
