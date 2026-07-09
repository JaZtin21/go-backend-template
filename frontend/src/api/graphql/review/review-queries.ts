import { gql } from '@apollo/client';

export const REVIEWS_BY_STORE_QUERY = gql`
  query ReviewsByStore($storeId: ObjectID!, $page: Int, $limit: Int) {
    reviewsByStore(storeId: $storeId, page: $page, limit: $limit) {
      success
      message
      data {
        id
        storeId
        userId
        user {
          id
          name
          profilePhoto
        }
        rating
        text
        photos
        createdAt
        updatedAt
      }
      total
      hasMore
    }
  }
`;

export const REVIEW_STATS_QUERY = gql`
  query ReviewStats($storeId: ObjectID!) {
    reviewStats(storeId: $storeId) {
      averageRating
      totalReviews
      fiveStars
      fourStars
      threeStars
      twoStars
      oneStar
    }
  }
`;

export const MY_REVIEW_FOR_STORE_QUERY = gql`
  query MyReviewForStore($storeId: ObjectID!) {
    myReviewForStore(storeId: $storeId) {
      success
      message
      data {
        id
        storeId
        userId
        rating
        text
        photos
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_REVIEW_MUTATION = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      success
      message
      data {
        id
        storeId
        userId
        user {
          id
          name
          profilePhoto
        }
        rating
        text
        photos
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_REVIEW_MUTATION = gql`
  mutation UpdateReview($id: ObjectID!, $input: UpdateReviewInput!) {
    updateReview(id: $id, input: $input) {
      success
      message
      data {
        id
        rating
        text
        photos
        updatedAt
      }
    }
  }
`;

export const DELETE_REVIEW_MUTATION = gql`
  mutation DeleteReview($id: ObjectID!) {
    deleteReview(id: $id) {
      success
      message
    }
  }
`;
