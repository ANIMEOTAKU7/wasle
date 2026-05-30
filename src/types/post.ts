export interface Comment {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string | null;
  };
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: number;
  comments: number;
  commentsList?: Comment[];
  isLiked?: boolean;
}
