export enum UserEventType {
	LOGIN = "LOGIN",
	LOGOUT = "LOGOUT",
	CREATE_REPO = "CREATE_REPO",
	DELETE_REPO = "DELETE_REPO",
	CREATE_ISSUE = "CREATE_ISSUE",
	CLOSE_ISSUE = "CLOSE_ISSUE",
	REOPEN_ISSUE = "REOPEN_ISSUE",
	CREATE_PULL_REQUEST = "CREATE_PULL_REQUEST",
	MERGE_PULL_REQUEST = "MERGE_PULL_REQUEST",
	CLOSE_PULL_REQUEST = "CLOSE_PULL_REQUEST",
	REOPEN_PULL_REQUEST = "REOPEN_PULL_REQUEST",
	FORK_REPO = "FORK_REPO",
	WATCH_REPO = "WATCH_REPO",
	UNWATCH_REPO = "UNWATCH_REPO",
	STAR_REPO = "STAR_REPO",
	UNSTAR_REPO = "UNSTAR_REPO",
}
