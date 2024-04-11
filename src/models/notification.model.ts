import type { NotificationData, NotificationType, UserBasic } from ".";
import type { BaseEntity } from "./base.model";

export interface Notification extends BaseEntity {
	id: string;
	user: UserBasic;
	user_id: string;
	type: NotificationType;
	data: NotificationData;
	read: boolean;
	created_at: Date;
}
