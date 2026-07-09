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
  coverPhoto?: string;
  newCoverPhoto?: File;
  sku?: string;
  barcode?: string;
  weight?: number;
  unit?: string; // e.g., "pcs", "kg", "L"
  expiryDate?: string;
  supplier?: string;
  brand?: string;
  origin?: string;
  tags: string[];
  isActive: boolean;
  discount?: Discount;
  createdAt?: string;
  updatedAt?: string;
  shopId?: string; // Reference to the shop that owns this item
}
