export interface Comment {
  id: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  pullRequestId: number;
  authorId: number;
  issueId: number | null;
}