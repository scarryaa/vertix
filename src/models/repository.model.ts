import type { Collaborator, Issue, License, Organization, PullRequest, Role, Star, Tag, User } from './index';

export type VisibilityType = "public" | "private";

export interface Repository {
    id: number;
    name: string;
    description?: string | null;
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
    owner?: Partial<User> & { role: typeof Role };
    ownerId: number;
    issues?: Partial<Issue>[] | null;
    stars?: Partial<Star>[] | null;
    language?: string | null;
    collaborators?: Partial<Collaborator>[] | null;
    license?: Partial<License> | null;
    licenseId?: number | null;
    tag?: Partial<Tag> | null;
    tagId?: number | null;
    organization?: Partial<Organization> | null;
    organizationId?: number | null;
    pullRequests?: Partial<PullRequest>[] | null;
  }
  