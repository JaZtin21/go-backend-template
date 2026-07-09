import { useMutation, useQuery, useLazyQuery } from '@apollo/client/react';
import {
  POSTS_QUERY,
  POST_QUERY,
  MY_POSTS_QUERY,
  USER_POSTS_QUERY,
  POSTS_NEAR_LOCATION_QUERY,
  CREATE_POST_MUTATION,
  UPDATE_POST_MUTATION,
  DELETE_POST_MUTATION,
  LIKE_POST_MUTATION,
  UNLIKE_POST_MUTATION,
} from './post-queries';

// Types
export interface PostLocation {
  lat: number;
  lng: number;
  name: string;
}

export interface PostAuthor {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  followers?: string[];
}

export interface Post {
  id: string;
  title: string;
  text: string;
  photos: string[];
  types: string[];
  author: PostAuthor;
  location?: PostLocation;
  likes: number;
  isLiked: boolean;
  commentCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePostInput {
  title: string;
  text: string;
  photos?: string[];
  types?: string[];
  location?: PostLocation;
}

export interface UpdatePostInput {
  title?: string;
  text?: string;
  photos?: string[];
  types?: string[];
  location?: PostLocation;
}

// Hooks
export const usePosts = (page?: number, limit?: number) => {
  return useQuery(POSTS_QUERY, {
    variables: { page, limit },
    fetchPolicy: 'cache-and-network',
  });
};

export const usePost = (id: string) => {
  return useQuery(POST_QUERY, {
    variables: { id },
    skip: !id,
  });
};

interface MyPostsResponse {
  myPosts: {
    success: boolean;
    message: string;
    data: Post[];
    total: number;
    page: number;
    limit: number;
  };
}

export const useMyPosts = (page?: number, limit?: number, skip?: boolean) => {
  return useQuery<MyPostsResponse>(MY_POSTS_QUERY, {
    variables: { page, limit },
    fetchPolicy: 'cache-and-network',
    skip,
  });
};

interface UserPostsResponse {
  userPosts: {
    success: boolean;
    message: string;
    data: Post[];
    total: number;
    page: number;
    limit: number;
  };
}

export const useGetUserPosts = (userId: string | null, page?: number, limit?: number, skip?: boolean) => {
  return useQuery<UserPostsResponse>(USER_POSTS_QUERY, {
    variables: { userId, page, limit },
    fetchPolicy: 'cache-and-network',
    skip: skip || !userId,
  });
};

export const usePostsNearLocation = () => {
  return useLazyQuery(POSTS_NEAR_LOCATION_QUERY, {
    fetchPolicy: 'network-only',
  });
};

export const useCreatePost = () => {
  return useMutation(CREATE_POST_MUTATION);
};

interface UpdatePostResponse {
  updatePost: {
    success: boolean;
    message: string;
    data: Post;
  };
}

export const useUpdatePost = () => {
  return useMutation<UpdatePostResponse>(UPDATE_POST_MUTATION);
};

export const useDeletePost = () => {
  return useMutation(DELETE_POST_MUTATION);
};

export const useLikePost = () => {
  return useMutation(LIKE_POST_MUTATION);
};

export const useUnlikePost = () => {
  return useMutation(UNLIKE_POST_MUTATION);
};
