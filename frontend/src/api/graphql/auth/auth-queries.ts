import { gql } from '@apollo/client';

// Auth GraphQL Queries and Mutations

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      success
      message
      data {
        accessToken
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      success
      message
    }
  }
`;

export const GOOGLE_LOGIN_MUTATION = gql`
  mutation GoogleLogin($input: GoogleLoginInput!) {
    googleLogin(input: $input) {
      success
      message
      data {
        user {
          id
          name
          email
          phone
          role
          shops
          profilePhoto
          coverPhoto
          createdAt
          updatedAt
          isActive
        }
        accessToken
      }
    }
  }
`;

// Types for GraphQL
export interface GoogleLoginInput {
  credential: string;
  role?: 'CUSTOMER' | 'OWNER' | 'ADMIN';
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'CUSTOMER' | 'OWNER' | 'ADMIN';
    shops: string[];
    profilePhoto?: string;
    coverPhoto?: string;
    createdAt: string;
    updatedAt?: string;
    isActive: boolean;
  };
  accessToken: string;
}

export interface AuthPayload {
  success: boolean;
  message: string;
  data?: AuthResponse;
}

export interface GoogleLoginResponse {
  googleLogin: AuthPayload;
}
