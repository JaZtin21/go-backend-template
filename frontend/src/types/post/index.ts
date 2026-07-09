// Post types - Source of truth for Post interface

export interface Comment {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    email: string;
    role?: string;
    isActive?: boolean;
    profilePhoto?: string;
  };
  createdAt: string;
  updatedAt?: string;
}

// GraphQL response types
export interface CommentsQueryResponse {
  comments?: {
    data: Comment[];
    hasMore: boolean;
    total: number;
  };
}

export interface PostQueryResponse {
  post?: {
    data: Post;
  };
}

export interface AddCommentMutationResponse {
  addComment?: {
    success: boolean;
    data: Comment;
  };
}

export interface DeleteCommentMutationResponse {
  deleteComment?: {
    success: boolean;
  };
}

export interface LoadMoreCommentsResponse {
  comments?: {
    data: Comment[];
    hasMore: boolean;
    total: number;
  };
}

export interface Post {
  id: string;
  title?: string;
  text?: string;
  photos?: string[];
  types?: string[];
  author?: {
    id?: string;
    name?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    profilePhoto?: string;
    followers?: string[];
  };
  likes?: number;
  commentCount?: number;
  createdAt?: string;
  location?: { lat: number; lng: number };
  [key: string]: any;
}

// Post creation input type (for forms)
export interface CreatePostInput {
  title: string;
  text: string;
  photos: File[];
  types: string[];
  location: { lat: number; lng: number; name: string };
}

// Component Props Interfaces
export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: { title: string; text: string; photos: File[]; types: string[]; location: { lat: number; lng: number; name: string } }) => void;
  isSubmitting?: boolean;
  currentLocation?: { lat: number; lng: number; name?: string } | null;
}

// Post preview modal props
export interface PostPreviewModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: (options?: { isNavigating?: boolean }) => void;
  modalRef?: React.RefObject<{ animateClose: () => void } | null>;
}

// Post type options - Food classifications
export const POST_TYPES = [
  'Beverage',
  'Snack',
  'Sweets',
  'Main Dish',
  'Side Dish',
  'Dessert',
  'Bakery',
  'Canned Goods',
  'Condiments',
  'Dairy',
  'Frozen Food',
  'Fruits',
  'Vegetables',
  'Other'
] as const;
