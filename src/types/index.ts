export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  storeName?: string;
}

export type ProductCategory = 
  | 'Abayas'
  | 'Formal'
  | 'Casual Wear'
  | 'Stoles & Hijabs'
  | 'Co-ords & Sets'
  | 'Festive Pret'
  | 'Accessories';

export type ProductSize = 
  | 'XS' 
  | 'S' 
  | 'M' 
  | 'L' 
  | 'XL' 
  | 'XXL' 
  | '50'
  | '52'
  | '54'
  | '56'
  | '58'
  | 'Free Size'
  | 'Standard';

export type ProductStatus = 'active' | 'archived';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory | string;
  size: ProductSize | string;
  color: string;
  description?: string;
  image?: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  barcode: string;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  barcode: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  employeeId: string;
  employeeName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  discountPercent?: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'online';
  amountPaid: number;
  change: number;
  notes?: string;
  createdAt: string;
}

export interface StoreSettings {
  brandName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  currencySymbol: string;
  currencyCode: string;
  taxRatePercent: number;
  taxNumber?: string;
  receiptFooterMessage: string;
}

export interface CartItem extends SaleItem {
  maxStock: number;
  image?: string;
}
