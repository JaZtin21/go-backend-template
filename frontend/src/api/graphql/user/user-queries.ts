import { gql } from '@apollo/client';

// User GraphQL Queries and Mutations

export const GET_USER = gql`
  query GetUser($id: ObjectID!) {
    user(id: $id) {
      id
      name
      firstName
      lastName
      email
      phone
      birthday
      profilePhoto
      coverPhoto
      role
      isActive
      followers
      following
      followersCount
      followingCount
      isFollowing
      shops
      createdAt
      updatedAt
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      success
      message
      data {
        id
        name
        firstName
        lastName
        email
        phone
        birthday
        role
        shops
        profilePhoto
        coverPhoto
        followers
        following
        followersCount
        followingCount
        isFollowing
        createdAt
        updatedAt
        isActive
      }
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      success
      message
      data {
        id
        firstName
        lastName
        name
        email
        phone
        birthday
        role
        shops
        createdAt
        updatedAt
        isActive
      }
    }
  }
`;

export const USERS_QUERY = gql`
  query Users($page: Int, $limit: Int) {
    users(page: $page, limit: $limit) {
      id
      name
      email
      phone
      role
      shops
      createdAt
      updatedAt
      isActive
    }
  }
`;

export const GET_USERS_BY_IDS = gql`
  query GetUsersByIds($ids: [ObjectID!]!) {
    usersByIds(ids: $ids) {
      id
      name
      profilePhoto
      email
    }
  }
`;

export const UPDATE_USER_STATUS_MUTATION = gql`
  mutation UpdateUserStatus($id: ID!, $isActive: Boolean!) {
    updateUserStatus(id: $id, isActive: $isActive) {
      success
      message
      data {
        id
        name
        email
        phone
        role
        shops
        createdAt
        updatedAt
        isActive
      }
    }
  }
`;

export const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      success
      message
      data {
        id
        name
        email
        phone
        role
        shops
        createdAt
        updatedAt
        isActive
      }
    }
  }
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
    }
  }
`;

// Types for GraphQL
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'CUSTOMER' | 'OWNER' | 'ADMIN';
}

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
  followers?: string[];
  following?: string[];
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface UserPayload {
  success: boolean;
  message: string;
  data?: User;
}

export interface UsersPayload {
  success: boolean;
  message: string;
  data: User[];
}
