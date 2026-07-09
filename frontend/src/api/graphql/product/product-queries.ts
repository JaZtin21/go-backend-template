import { gql } from '@apollo/client';

// Product/Item GraphQL Queries and Mutations

export const ITEM_QUERY = gql`
  query Item($id: ID!) {
    item(id: $id) {
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
        discount {
          percentage
          validUntil
        }
        createdAt
        updatedAt
        shopId
      }
    }
  }
`;

export const ITEMS_QUERY = gql`
  query Items($input: ProductSearchInput) {
    items(input: $input) {
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
        discount {
          percentage
          validUntil
        }
        createdAt
        updatedAt
        shopId
      }
    }
  }
`;

// Public Product Queries (for normal users browsing)
export const PUBLIC_ITEMS_QUERY = gql`
  query Items($input: ProductSearchInput) {
    items(input: $input) {
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
        discount {
          percentage
          validUntil
        }
        createdAt
        updatedAt
        shopId
      }
    }
  }
`;

// Product Mutations
export const CREATE_ITEM_MUTATION = gql`
  mutation CreateItem($input: CreateItemInput!) {
    createItem(input: $input) {
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
    }
  }
`;

export const UPDATE_ITEM_MUTATION = gql`
  mutation UpdateItem($id: ObjectID!, $input: UpdateItemInput!) {
    updateItem(id: $id, input: $input) {
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
        discount {
          percentage
          validUntil
        }
        createdAt
        updatedAt
        shopId
      }
    }
  }
`;

export const DELETE_ITEM_MUTATION = gql`
  mutation DeleteItem($id: ObjectID!) {
    deleteItem(id: $id) {
      success
      message
    }
  }
`;

// Types for GraphQL
export interface Discount {
  percentage?: number;
  validUntil?: string;
}

export interface Item {
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
  rating?: number;
  discount?: Discount;
  createdAt?: string;
  updatedAt?: string;
  shopId: string;
}

export interface ProductSearchInput {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  shopId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateItemInput {
  name: string;
  price: number;
  description: string;
  category: string;
  subCategory?: string;
  stock: number;
  coverPhoto?: File;
  sku?: string;
  barcode?: string;
  weight?: number;
  unit?: string;
  expiryDate?: string;
  supplier?: string;
  brand?: string;
  origin?: string;
  tags: string[];
  shopId: string;
  discount?: Discount;
}

export interface UpdateItemInput {
  name?: string;
  price?: number;
  description?: string;
  category?: string;
  subCategory?: string;
  stock?: number;
  coverPhoto?: string;
  newCoverPhoto?: File;
  sku?: string;
  barcode?: string;
  weight?: number;
  unit?: string;
  expiryDate?: string;
  supplier?: string;
  brand?: string;
  origin?: string;
  tags?: string[];
  discount?: Discount;
}

export interface ItemPayload {
  success: boolean;
  message: string;
  data?: Item;
}

export interface ItemsPayload {
  success: boolean;
  message: string;
  data: Item[];
}

export interface ProductDeletePayload {
  success: boolean;
  message: string;
}
