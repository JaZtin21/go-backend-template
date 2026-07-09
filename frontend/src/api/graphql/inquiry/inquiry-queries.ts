import { gql } from '@apollo/client';

export const INQUIRIES_FOR_SHOP_QUERY = gql`
  query InquiriesForShop($shopID: ID!, $page: Int, $limit: Int) {
    inquiriesForShop(shopID: $shopID, page: $page, limit: $limit) {
      success
      message
      data {
        id
        user {
          id
          name
          profilePhoto
        }
        shop {
          id
          name
        }
        item
        message
        status
        replies {
          id
          author {
            id
            name
            profilePhoto
          }
          message
          createdAt
        }
        createdAt
        updatedAt
      }
      total
      page
      totalPages
    }
  }
`;

export const INQUIRIES_BY_USER_QUERY = gql`
  query InquiriesByUser($userId: ID!, $page: Int, $limit: Int) {
    inquiriesByUser(userId: $userId, page: $page, limit: $limit) {
      success
      message
      data {
        id
        user {
          id
          name
          profilePhoto
        }
        shop {
          id
          name
        }
        item
        message
        status
        replies {
          id
          author {
            id
            name
            profilePhoto
          }
          message
          createdAt
        }
        createdAt
        updatedAt
      }
      total
      page
      totalPages
    }
  }
`;

export const USER_INQUIRY_FOR_SHOP_QUERY = gql`
  query UserInquiryForShop($userID: ID!, $shopID: ID!) {
    userInquiryForShop(userID: $userID, shopID: $shopID) {
      success
      message
      data {
        id
        user {
          id
          name
          profilePhoto
        }
        shop {
          id
          name
        }
        item
        message
        status
        replies {
          id
          author {
            id
            name
            profilePhoto
          }
          message
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const INQUIRY_QUERY = gql`
  query Inquiry($id: ID!) {
    inquiry(id: $id) {
      success
      message
      data {
        id
        user {
          id
          name
          profilePhoto
        }
        shop {
          id
          name
          coverPhoto
        }
        item
        message
        status
        replies {
          id
          author {
            id
            name
            profilePhoto
          }
          message
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const CREATE_INQUIRY_MUTATION = gql`
  mutation CreateInquiry($input: CreateInquiryInput!) {
    createInquiry(input: $input) {
      success
      message
      data {
        id
        user {
          id
          name
          profilePhoto
        }
        shop {
          id
          name
        }
        item
        message
        status
        replies {
          id
          author {
            id
            name
            profilePhoto
          }
          message
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const REPLY_TO_INQUIRY_MUTATION = gql`
  mutation ReplyToInquiry($input: ReplyToInquiryInput!) {
    replyToInquiry(input: $input) {
      success
      message
      data {
        id
        author {
          id
          name
          profilePhoto
        }
        message
        createdAt
      }
    }
  }
`;

export const UPDATE_INQUIRY_STATUS_MUTATION = gql`
  mutation UpdateInquiryStatus($input: UpdateInquiryStatusInput!) {
    updateInquiryStatus(input: $input) {
      success
      message
      data {
        id
        status
        updatedAt
      }
    }
  }
`;

export const INQUIRY_REPLIED_SUBSCRIPTION = gql`
  subscription InquiryReplied($inquiryId: ID!) {
    inquiryReplied(inquiryId: $inquiryId) {
      id
      author {
        id
        name
        profilePhoto
      }
      message
      createdAt
    }
  }
`;

export const NEW_INQUIRY_FOR_SHOP_SUBSCRIPTION = gql`
  subscription NewInquiryForShop($shopId: ID!) {
    newInquiryForShop(shopId: $shopId) {
      id
      user {
        id
        name
        profilePhoto
      }
      item
      message
      status
      createdAt
    }
  }
`;
