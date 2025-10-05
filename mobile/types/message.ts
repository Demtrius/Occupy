// Message/Notification Types

import { User } from './user';
import { Post } from './post';

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  read: boolean;
  createdAt: string;
  sender?: User;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'message' | 'like' | 'comment' | 'follow' | 'cliqueInvite';
  content: string;
  read: boolean;
  createdAt: string;
  relatedUser?: User;
  relatedPost?: Post;
}
