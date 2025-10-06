import { User } from './user';

// Clique Types
export interface Clique {
  id: number;
  name: string;
  description?: string;
  image?: string;
  occupation?: string;
  membersCount?: number;
  postsCount?: number;
  createdBy?: User;
  createdAt?: string;
  updatedAt?: string;
  isMember?: boolean;
  isPublic?: boolean;
}

export interface CreateCliqueData {
  name: string;
  description?: string;
  image?: string;
}
