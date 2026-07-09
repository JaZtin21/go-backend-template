// User Types
// Note: Post type is imported from '../map' to avoid duplication

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  birthday?: string;
  role: 'CUSTOMER' | 'OWNER' | 'ADMIN';
  shops: string[];
  profilePhoto?: string;
  coverPhoto?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  postsCount?: number;
  followers?: string[];
  following?: string[];
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthday?: string;
}

export interface UserPayload {
  success: boolean;
  message: string;
  data?: User;
}
