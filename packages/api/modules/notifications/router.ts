import { deleteNotificationProcedure } from "./procedures/delete-notification";
import {
	getNotificationUnreadCount,
	listNotifications,
} from "./procedures/list-notifications";
import {
	markAllNotificationsAsRead,
	markNotificationAsRead,
} from "./procedures/mark-as-read";

export const notificationsRouter = {
	list: listNotifications,
	unreadCount: getNotificationUnreadCount,
	markAsRead: markNotificationAsRead,
	markAllAsRead: markAllNotificationsAsRead,
	delete: deleteNotificationProcedure,
};
