// User/Occupier Types

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profileImage?: string;
  occupations?: string;
  isBusinessPage?: boolean;
  privateAccount?: boolean;
  created?: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  cliquesCount?: number;
  isFollowing?: boolean;
  followers?: number;
  following?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OccupierObj extends User {
  token?: string;
}

export interface Occupation {
  id: number;
  name: string;
  category: string;
  userCount?: number;
}
