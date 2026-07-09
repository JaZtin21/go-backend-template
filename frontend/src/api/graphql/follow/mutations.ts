import { gql } from '@apollo/client';

export const FOLLOW_USER = gql`
  mutation FollowUser($userId: ObjectID!) {
    followUser(userId: $userId) {
      success
      message
      data {
        id
        name
        firstName
        lastName
        email
        profilePhoto
        coverPhoto
      }
    }
  }
`;

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: ObjectID!) {
    unfollowUser(userId: $userId) {
      success
      message
      data {
        id
        name
        firstName
        lastName
        email
        profilePhoto
        coverPhoto
      }
    }
  }
`;
