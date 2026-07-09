import { gql } from '@apollo/client';

// Owner-specific GraphQL Queries
// Note: All mutations (createShop, updateShop, deleteShop, createItem, updateItem, deleteItem)
// are now exported from shop-queries.ts and product-queries.ts to avoid duplication

// Owner Shop Queries
export const GET_OWNER_SHOPS_QUERY = gql`
  query GetOwnerShops($page: Int, $limit: Int) {
    myShops(page: $page, limit: $limit) {
      success
      message
      data {
        id
        name
        description
        location
        coordinates {
          lat
          lng
        }
        coverPhoto
        businessHours {
          openTime
          closeTime
          days
        }
        businessType
        paymentMethods {
          cash
          gcash
          paymaya
          card
        }
        delivery {
          available
          radius
          fee
          minOrder
        }
        socialMedia {
          facebook
          instagram
        }
        verification {
          isVerified
          verifiedDate
          verificationId
        }
        contactDetails {
          phone
          email
          address
        }
        createdAt
        updatedAt
        createdBy
        status
      }
    }
  }
`;

// Owner Product Queries
export const GET_OWNER_ITEMS_QUERY = gql`
  query GetOwnerItems($page: Int, $limit: Int, $shopId: ObjectID) {
    myItems(page: $page, limit: $limit, shopId: $shopId) {
      success
      message
      data {
        id
        name
        price
        description
        category
        subCategory
        stock
        coverPhoto
        sku
        barcode
        weight
        unit
        expiryDate
        supplier
        brand
        origin
        tags
        isActive
        rating
        discount {
          percentage
          validUntil
        }
        createdAt
        updatedAt
        shopId
      }
      total
      page
      totalPages
    }
  }
`;

// Types for Owner GraphQL Operations
export interface OwnerShop {
  id: string;
  name: string;
  description?: string;
  location: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  coverPhoto: string;
  businessHours: {
    openTime: string;
    closeTime: string;
    days: string[];
  };
  businessType: 'SARI_SARI_STORE' | 'GROCERY' | 'CONVENIENCE_STORE' | 'MINI_MART';
  paymentMethods: {
    cash: boolean;
    gcash: boolean;
    paymaya: boolean;
    card: boolean;
  };
  delivery: {
    available: boolean;
    radius?: number;
    fee?: number;
    minOrder?: number;
  };
  socialMedia: {
    facebook?: string;
    instagram?: string;
  };
  verification: {
    isVerified: boolean;
    verifiedDate?: string;
    verificationId?: string;
  };
  contactDetails: {
    phone: string;
    email: string;
    address: string;
  };
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface OwnerItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  subCategory?: string;
  stock: number;
  coverPhoto: string;
  sku?: string;
  barcode?: string;
  weight?: number;
  unit?: string;
  expiryDate?: string;
  supplier?: string;
  brand?: string;
  origin?: string;
  tags: string[];
  isActive: boolean;
  discount?: {
    percentage?: number;
    validUntil?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  shopId: string;
}

export interface ShopAnalytics {
  shopId: string;
  totalViews: number;
  totalOrders: number;
  revenue: number;
  topItems: {
    id: string;
    name: string;
    sales: number;
  }[];
}

export interface ItemAnalytics {
  itemId: string;
  totalViews: number;
  totalSales: number;
  revenue: number;
  lowStock: boolean;
  stock: number;
}

export interface BulkUpdateResponse {
  updatedCount: number;
  itemIds: string[];
}
