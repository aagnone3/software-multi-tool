import { cn } from "@ui/lib";
import Image from "next/image";

export function Logo({
	withLabel = true,
	className,
}: {
	className?: string;
	withLabel?: boolean;
}) {
	return (
		<span
			className={cn(
				"flex items-center font-semibold text-foreground leading-none",
				className,
			)}
		>
			<Image
				src="/images/icon-sd.png"
				alt="AI Multitool"
				width={40}
				height={40}
				className="size-10"
			/>
			{withLabel && (
				<span className="ml-3 hidden text-lg md:block">
					AI Multitool
				</span>
			)}
		</span>
	);
}
