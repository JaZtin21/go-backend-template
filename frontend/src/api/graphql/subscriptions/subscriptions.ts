import { gql } from '@apollo/client';

// GraphQL Subscriptions for real-time features

export const ITEM_STOCK_UPDATES_SUBSCRIPTION = gql`
  subscription ItemStockUpdates($shopId: ID!) {
    itemStockUpdates(shopID: $shopId) {
      id
      name
      price
      stock
      isActive
      shopId
      updatedAt
    }
  }
`;

export const SHOP_STATUS_UPDATES_SUBSCRIPTION = gql`
  subscription ShopStatusUpdates {
    shopStatusUpdates {
      id
      name
      status
      verification {
        isVerified
        verifiedDate
      }
      updatedAt
    }
  }
`;

// Types for GraphQL Subscriptions
export interface ItemStockUpdate {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  shopId: string;
  updatedAt?: string;
}

export interface ShopStatusUpdate {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  verification: {
    isVerified: boolean;
    verifiedDate?: string;
  };
  updatedAt?: string;
}
