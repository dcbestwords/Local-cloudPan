export interface Comment {
  user: string;
  date: string;
  content: string;
}

export interface Shop {
  id: number;
  name: string;
  category: string;
  rating: number;
  distance: string;
  price: string;
  tags: string[];
  description: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
  cover: string;
  commentsList?: Comment[];
  isLiked?: boolean;
}

export interface ShareForm {
  name: string;
  category: string;
  price: string;
  distance: string;
  rating: number;
  tags: string[];
  cover: string;
  description: string;
}

export function emptyPostForm(): ShareForm {
  return {
    name: '',
    category: '',
    price: '',
    distance: '',
    rating: 0,
    tags: [],
    cover: '',
    description: '',
  };
}
