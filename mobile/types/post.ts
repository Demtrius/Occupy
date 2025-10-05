// Post Types

export interface Post {
  id: number;
  content: string;
  caption: string;
  userId: number;
  cliqueId: number;
  occupier?: string;
  clique?: string;
  avatar?: string;
  posted?: string;
  createdAt?: string;
  updatedAt?: string;
  likesCount?: number;
  commentsCount?: number;
}

export interface CreatePostData {
  content: string;
  caption: string;
  cliqueId: number;
}
