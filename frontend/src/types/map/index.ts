// Map types
import type { Post as PostType } from '../post';

// Re-export Post for backward compatibility
export type { PostType as Post };

export interface PostMarker {
  lat: number;
  lng: number;
  title?: string;
  type?: 'store' | 'post';
  post?: PostType;
  id?: string;
  // Rotation/clustering properties for posts
  rotationIndex?: number;
  totalInCluster?: number;
  clusterId?: string;
  // Store extra fields
  location?: string;
  coverPhoto?: string;
  businessType?: string;
  description?: string;
  phone?: string;
  email?: string;
  hours?: string;
}

export interface MapProps {
  center: { lat: number; lng: number };
  zoom: number;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (store: { lat: number; lng: number; name: string; id?: string; location?: string; coverPhoto?: string; businessType?: string; description?: string; phone?: string; email?: string; hours?: string }) => void;
  onMapMoveEnd?: (center: { lat: number; lng: number }, zoom: number) => void;
  onPostClick?: (post: PostType, clusterId?: string) => void;
  markers?: PostMarker[];
  currentLocation?: { lat: number; lng: number; name?: string } | null;
}

// Store types
export interface Store {
  lat: number;
  lng: number;
  title: string;
  id?: string;
  location?: string; // Address string from search results
  coverPhoto?: string;
  businessType?: string;
  description?: string;
  phone?: string;
  email?: string;
  hours?: string;
  rating?: number;
}

// Handler option types
export interface ProductHandlersOptions {
  setProductNameForSearch: (name: string | null) => void;
  setProductSearchStores: (stores: Store[]) => void;
  setFilteredStores: (stores: Store[]) => void;
  refetchShopsByProduct: (variables: { productName: string }) => Promise<any>;
}

export interface PostHandlersOptions {
  createPost: (options: { variables: { input: any } }) => Promise<any>;
  showSuccess: (title: string, message: string) => void;
  showError: (title: string, message: string) => void;
}

export interface StoreHandlersOptions {
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  setSelectedStore: (store: Store | null) => void;
  fetchPosts: (options: { variables: any }) => void;
  postsLoading: boolean;
  lastFetchCenterRef: React.MutableRefObject<{ lat: number; lng: number } | null>;
  dispatch: import('react').Dispatch<any>;
  openSideNav: (data: any) => any;
}

export interface LocationHandlersOptions {
  setMapCenter: (center: { lat: number; lng: number }) => void;
  setMapZoom: (zoom: number) => void;
  setLocationQuery: (query: string) => void;
  setCurrentLocation: (location: { lat: number; lng: number; name?: string } | null) => void;
  fetchPosts: (options: { variables: any }) => void;
  postsLoading: boolean;
  lastFetchCenterRef: React.MutableRefObject<{ lat: number; lng: number } | null>;
  setIsLocating?: (isLocating: boolean) => void;
}

// Hook option types
export interface UseMapPostsOptions {
  postsData?: any; // Legacy fetch data
  livePosts?: PostType[]; // Live subscription posts (last 24h)
  pausedClusters?: Set<string>; // Cluster IDs to pause rotation for
}


export interface UseMapMarkersOptions {
  filteredStores: Store[];
  productSearchStores: Store[];
  groupedPostClusters: any[];
  clusterRotations: Map<string, number>;
  mapZoom: number;
  selectedStore: Store | null;
}

export interface MapCenter {
  lat: number;
  lng: number;
}

export interface UseMapCenterOptions {
  // Legacy: for backward compatibility, not used with live posts
  fetchPosts?: (options: { variables: any }) => void;
  postsLoading?: boolean;
  initialCenter?: MapCenter;
  initialZoom?: number;
}

// SearchBar component props
export interface SearchBarProps {
  onSearch: (query: string) => void;
  onStoreSelect?: (store: { lat: number; lng: number; name: string; id?: string; description?: string; location?: string; coverPhoto?: string; businessType?: string; phone?: string; hours?: string }) => void;
  onProductSelect?: (productName: string, stores: any[]) => void;
  onPostSelect?: (postTitle: string) => void;
  onClearProductStores?: () => void;
  onClearAllMarkers?: () => void;
  showClearMarkersButton?: boolean;
  placeholder?: string;
  onClear?: () => void;
  handleToggleShopsNearMe?: () => void;
  isLoadingShopsNearMe?: boolean;
  showShopsNearMe?: boolean;
}

// Additional types from OptimizedMapsPage
export type StoreLocationData = {
  lat: number;
  lng: number;
  name: string;
  id?: string;
  description?: string;
  location?: string;
  coverPhoto?: string;
  businessType?: string;
  phone?: string;
  hours?: string;
};

export type LocationPinData = {
  lat: number;
  lng: number;
  name: string;
  address?: string;
  image?: string;
};

export type ProductStore = {
  id: string;
  lat: number;
  lng: number;
  name: string;
  address?: string;
  image?: string;
};

// Group posts that are within threshold distance of each other
export type PostGroup = { posts: PostType[] };
export type PostOrGroup = { type: 'single'; post: PostType } | { type: 'group'; group: PostGroup };

// MapMarkers component props
export interface MapMarkersProps {
  livePosts: PostType[];
  deletedPostIds: Set<string>;
  editedPostIds: Set<string>;
  onPostClick: (post: PostType) => void;
  showStoreMarker: boolean;
  storeMarkerData: StoreLocationData | null;
  onStoreMarkerClick: (store: StoreLocationData) => void;
  showLocationPinMarker: boolean;
  locationPinData: LocationPinData | null;
  showProductStoreMarkers: boolean;
  productSearchStores: ProductStore[];
  showPostMarkers: boolean;
  postSearchResults: any[];
  userLocation: { lat: number; lng: number } | null;
  showUserLocationMarker: boolean;
  showShopsNearMe: boolean;
  shopsNearMe: StoreLocationData[];
  onShopNearMeClick: (store: StoreLocationData) => void;
}
