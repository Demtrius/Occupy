// User/Occupier Types

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  bio?: string;
  profileImage?: string;
  occupations?: string;
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
