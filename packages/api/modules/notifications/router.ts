import { deleteNotificationProcedure } from "./procedures/delete-notification";
import { getPreferencesProcedure } from "./procedures/get-preferences";
import {
	getNotificationUnreadCount,
	listNotifications,
} from "./procedures/list-notifications";
import {
	markAllNotificationsAsRead,
	markNotificationAsRead,
} from "./procedures/mark-as-read";
import { updatePreferencesProcedure } from "./procedures/update-preferences";

export const notificationsRouter = {
	list: listNotifications,
	unreadCount: getNotificationUnreadCount,
	markAsRead: markNotificationAsRead,
	markAllAsRead: markAllNotificationsAsRead,
	delete: deleteNotificationProcedure,
	getPreferences: getPreferencesProcedure,
	updatePreferences: updatePreferencesProcedure,
};
