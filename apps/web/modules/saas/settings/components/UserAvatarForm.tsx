"use client";
import { SettingsItem } from "@saas/shared/components/SettingsItem";
import { toast } from "sonner";
import { UserAvatarUpload } from "./UserAvatarUpload";

export function UserAvatarForm() {
	return (
		<SettingsItem
			title="Your avatar"
			description="To change your avatar click the picture in this block and select a file from your computer to upload."
		>
			<UserAvatarUpload
				onSuccess={() => {
					toast.success("Avatar was updated successfully");
				}}
				onError={() => {
					toast.error("Could not update avatar");
				}}
			/>
		</SettingsItem>
	);
}
