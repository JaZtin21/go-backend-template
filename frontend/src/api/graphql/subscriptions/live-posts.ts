import { gql } from '@apollo/client';

// Subscription for live posts from last 24 hours
export const LIVE_POSTS_SUBSCRIPTION = gql`
  subscription LivePosts {
    livePosts {
      id
      title
      text
      photos
      types
      location {
        lat
        lng
        name
      }
      author {
        id
        name
        email
        firstName
        lastName
        role
        profilePhoto
        priority
      }
      likes
      isLiked
      comments {
        id
        text
        author {
          id
          name
          email
          firstName
          lastName
          profilePhoto
        }
        createdAt
        updatedAt
      }
      commentCount
      quality
      createdAt
      updatedAt
    }
  }
`;
