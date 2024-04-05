import type { NotificationData, NotificationType, UserBasic } from ".";

export interface Notification {
	id: number;
	user: UserBasic;
	user_id: number;
	type: NotificationType;
	data: NotificationData;
	read: boolean;
	created_at: Date;
}
