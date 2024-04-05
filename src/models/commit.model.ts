export interface Commit {
  id: number;
  sha: string;
  message: string;
  createdAt: Date;
  pullRequestId: number;
  authorId: number;
}