export type NotificationData = {
    repository_name: string;
    issue_title: string | null;
    pull_request_title: string | null;
    comment_body: string | null;
}