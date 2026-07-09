import { gql } from '@apollo/client';

export const GET_USER_FOLLOW_STATUS = gql`
  query GetUserFollowStatus($userId: ObjectID!) {
    user(id: $userId) {
      id
      name
      firstName
      lastName
      email
      profilePhoto
      coverPhoto
      followersCount
      followingCount
      isFollowing
    }
  }
`;

export const GET_USER_FOLLOWERS = gql`
  query GetUserFollowers($userId: ObjectID!) {
    followers(userId: $userId) {
      id
      name
      firstName
      lastName
      email
      profilePhoto
    }
  }
`;

export const GET_USER_FOLLOWING = gql`
  query GetUserFollowing($userId: ObjectID!) {
    following(userId: $userId) {
      id
      name
      firstName
      lastName
      email
      profilePhoto
    }
  }
`;
