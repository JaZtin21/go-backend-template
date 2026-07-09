import type { Shop as ShopType } from '../shop';
import type { Item as ItemType } from '../item';

// Owner-specific types and interfaces
export type ActiveTab = 'shops' | 'add-item' | 'inventory' | 'add-shop' | 'inquiries' | 'edit-shop' | 'edit-item';

// Re-export Shop and Item types for convenience
export type { ShopType as Shop };
export type { ItemType as Item };

export interface NewItemForm {
  name: string;
  price: string;
  description: string;
  category: string;
  stock: string;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  shops: string[]; // Array of shop IDs
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

// Component Props Interfaces
export interface AddItemFormProps {
  onAddItem: (item: ItemType) => void;
  item?: ItemType | null;
  onCancel?: () => void;
}

export interface Inquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'responded' | 'resolved';
}

export interface InquiriesProps {
  shop: ShopType;
}

export interface InventoryTableProps {
  shops: ShopType[];
  onEditItem: (shopId: string, itemId: string) => void;
  onDeleteItem: (shopId: string, itemId: string) => void;
  page: number;
  setPage: (page: number) => void;
  total: number;
  totalPages: number;
}

export interface LocationPickerProps {
  onLocationSelect: (coordinates: { lat: number; lng: number }, address: string) => void;
  initialLocation?: { lat: number; lng: number };
  initialAddress?: string;
}

export interface ShopCardProps {
  shop: ShopType;
  onManageShop: (shopId: string) => void;
  onDeleteShop?: (shopId: string) => void;
}

export interface ShopFormProps {
  shop?: ShopType | null;
  onSaveShop: (shop: ShopType, existingCoverPhoto?: string, newCoverFile?: File) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface TabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isShopView?: boolean;
}

// Hook interfaces
export interface UseItemManagementProps {
  selectedShop: ShopType | null;
  isAuthenticated: boolean;
  onSuccess?: (title: string, message: string) => void;
  onError?: (title: string, message: string) => void;
  onConfirmDelete?: (item: ItemType, onConfirm: () => void) => void;
}

export interface UseItemManagementReturn {
  items: any[];
  itemsLoading: boolean;
  handleAddItem: (item: ItemType) => Promise<void>;
  handleEditItem: (shopId: string, itemId: string, itemData: ItemType) => Promise<void>;
  handleDeleteItem: (shopId: string, itemId: string) => void;
  refreshItems: () => Promise<void>;
  page: number;
  setPage: (page: number) => void;
  total: number;
  totalPages: number;
}

export interface UseShopManagementProps {
  isAuthenticated: boolean;
  authLoading: boolean;
  onSuccess?: (title: string, message: string) => void;
  onError?: (title: string, message: string) => void;
}

export interface UseShopManagementReturn {
  shops: ShopType[];
  shopsLoading: boolean;
  shopsError: Error | undefined;
  createShop: (shop: ShopType, existingCoverPhoto?: string, newCoverFile?: File, otherPhotoFiles?: File[]) => Promise<{ success: boolean; message?: string }>;
  updateShop: (shop: ShopType, existingCoverPhoto?: string, newCoverFile?: File, newOtherPhotoFiles?: File[]) => Promise<{ success: boolean; message?: string; data?: ShopType }>;
  deleteShop: (shopId: string) => Promise<{ success: boolean; message?: string }>;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  refreshShops: () => Promise<void>;
}
