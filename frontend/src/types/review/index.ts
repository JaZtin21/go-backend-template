// Review types for store reviews

export interface Review {
  id: string;
  storeId: string;
  userId: string;
  user: ReviewUser;
  rating: number;
  text?: string;
  photos: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewUser {
  id: string;
  name: string;
  email?: string;
  profilePhoto?: string;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}

export interface AddReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  existingReview?: Review | null;
  onSuccess: (review?: Review) => void;
  onError?: (message: string) => void;
}

export interface CreateReviewInput {
  storeId: string;
  rating: number;
  text?: string;
  photos: File[];
}

export interface UpdateReviewInput {
  rating?: number;
  text?: string;
  photos?: string[];
}

export interface ReviewsPayload {
  success: boolean;
  message: string;
  data: Review[];
  total: number;
  hasMore: boolean;
}

export interface ReviewPayload {
  success: boolean;
  message: string;
  data?: Review;
}

export interface ReviewStatsPayload {
  success: boolean;
  message: string;
  averageRating: number;
  totalReviews: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
}
