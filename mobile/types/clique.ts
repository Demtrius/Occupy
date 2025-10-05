// Clique Types

export interface Clique {
  id: number;
  name: string;
  description?: string;
  image?: string;
  membersCount?: number;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  isMember?: boolean;
}

export interface CreateCliqueData {
  name: string;
  description?: string;
  image?: string;
}
