
export interface StoreInfo {
  name: string;
  description: string;
  whatsappNumber: string;
  currency: string;
  logo?: string;
  primaryColor?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  stockQuantity: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  description: string;
  image: string; // Base64 or URL (main image)
  images: string[]; // All images including the main one
  media?: MediaItem[]; // New media field supporting images and videos
  stockQuantity: number;
  variants?: ProductVariant[];
}
