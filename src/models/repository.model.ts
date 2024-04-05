import type { Collaborator, Issue, License, Organization, PullRequest, Star, Tag, User } from './index';

export type VisibilityType = "public" | "private";

export interface Repository {
    id: number;
    name: string;
    description?: string | null;
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
    owner?: User;
    ownerId: number;
    issues?: Issue[] | null;
    stars?: Star[] | null;
    language?: string | null;
    collaborators?: Collaborator[] | null;
    license?: License | null;
    licenseId?: number | null;
    tag?: Tag | null;
    tagId?: number | null;
    organization?: Organization | null;
    organizationId?: number | null;
    pullRequests?: PullRequest[] | null;
  }
  