import { Product, Sale, StoreSettings, User } from '../types';
import { api, ApiError, notifyChange, STORAGE_CHANGE_EVENT } from './api';

export { STORAGE_CHANGE_EVENT, notifyChange };

type Paginated<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// ---------------- PRODUCTS ----------------

export async function getStoredProducts(params?: {
  search?: string;
  category?: string;
  status?: string;
  lowStock?: boolean;
  limit?: number;
}): Promise<Product[]> {
  const query = new URLSearchParams();
  query.set('limit', String(params?.limit ?? 200));
  query.set('page', '1');
  if (params?.search) query.set('search', params.search);
  if (params?.category) query.set('category', params.category);
  if (params?.status) query.set('status', params.status);
  if (params?.lowStock) query.set('lowStock', 'true');

  const data = await api.get<Paginated<Product>>(`/products?${query.toString()}`);
  return data.items;
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    return await api.get<Product>(`/products/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function getProductByBarcode(barcode: string): Promise<Product | undefined> {
  if (!barcode) return undefined;
  try {
    return await api.get<Product>(`/products/barcode/${encodeURIComponent(barcode.trim())}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function addProduct(
  productData: Omit<Product, 'id' | 'barcode' | 'createdAt' | 'updatedAt' | 'status'> & {
    barcode?: string;
    categoryId?: string;
  }
): Promise<Product> {
  const created = await api.post<Product>('/products', {
    name: productData.name,
    category: productData.category,
    categoryId: productData.categoryId,
    size: productData.size,
    color: productData.color,
    description: productData.description,
    image: productData.image,
    purchasePrice: productData.purchasePrice,
    sellingPrice: productData.sellingPrice,
    stock: productData.stock,
    barcode: productData.barcode,
  });
  notifyChange();
  return created;
}

export async function updateProduct(id: string, updates: Partial<Product> & { categoryId?: string }): Promise<Product | null> {
  try {
    const updated = await api.patch<Product>(`/products/${id}`, {
      name: updates.name,
      category: updates.category,
      categoryId: updates.categoryId,
      size: updates.size,
      color: updates.color,
      description: updates.description,
      image: updates.image,
      purchasePrice: updates.purchasePrice,
      sellingPrice: updates.sellingPrice,
      barcode: updates.barcode,
      status: updates.status,
    });
    notifyChange();
    return updated;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  await api.delete(`/products/${id}`);
  notifyChange();
  return true;
}

export async function updateProductStock(id: string, newStock: number): Promise<Product | null> {
  const result = await api.post<{ product: Product }>('/inventory/adjust', {
    productId: id,
    newStock: Math.max(0, newStock),
    reason: 'Manual stock adjustment',
  });
  notifyChange();
  return result.product;
}

export async function addProductStock(id: string, quantity: number, reason?: string): Promise<Product> {
  const result = await api.post<{ product: Product }>('/inventory/add', {
    productId: id,
    quantity,
    reason,
  });
  notifyChange();
  return result.product;
}

export async function removeProductStock(id: string, quantity: number, reason?: string): Promise<Product> {
  const result = await api.post<{ product: Product }>('/inventory/remove', {
    productId: id,
    quantity,
    reason,
  });
  notifyChange();
  return result.product;
}

// ---------------- SALES & CHECKOUT ----------------

export async function getStoredSales(params?: {
  search?: string;
  paymentMethod?: string;
  limit?: number;
}): Promise<Sale[]> {
  const query = new URLSearchParams();
  query.set('limit', String(params?.limit ?? 100));
  query.set('page', '1');
  if (params?.search) query.set('search', params.search);
  if (params?.paymentMethod && params.paymentMethod !== 'all') {
    query.set('paymentMethod', params.paymentMethod);
  }

  const data = await api.get<Paginated<Sale>>(`/sales?${query.toString()}`);
  return data.items;
}

export async function getSaleById(id: string): Promise<Sale | undefined> {
  try {
    return await api.get<Sale>(`/sales/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return undefined;
    throw err;
  }
}

export async function executeSaleTransaction(saleData: {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  discount?: number;
  discountPercent?: number;
  paymentMethod: 'cash' | 'card' | 'online';
  amountPaid: number;
  notes?: string;
}): Promise<{ success: boolean; sale?: Sale; error?: string }> {
  try {
    const sale = await api.post<Sale>('/sales', {
      items: saleData.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      discount: saleData.discount,
      discountPercent: saleData.discountPercent,
      paymentMethod: saleData.paymentMethod,
      amountPaid: saleData.amountPaid,
      notes: saleData.notes,
    });
    notifyChange();
    return { success: true, sale };
  } catch (err) {
    const message = err instanceof ApiError ? err.message : 'Failed to complete sale';
    return { success: false, error: message };
  }
}

// ---------------- STORE SETTINGS ----------------

let settingsCache: StoreSettings | null = null;

export async function getStoredSettings(): Promise<StoreSettings> {
  if (settingsCache) return settingsCache;
  const settings = await api.get<StoreSettings>('/settings');
  settingsCache = settings;
  return settings;
}

export async function saveStoredSettings(settings: StoreSettings): Promise<StoreSettings> {
  const updated = await api.put<StoreSettings>('/settings', settings);
  settingsCache = updated;
  notifyChange();
  return updated;
}

export function clearSettingsCache() {
  settingsCache = null;
}

// ---------------- CATEGORIES ----------------

export async function getCategories(): Promise<Array<{ id: string; name: string; isActive: boolean }>> {
  return api.get('/categories');
}

// ---------------- DASHBOARD ----------------

export async function getDashboard() {
  return api.get<{
    totalProducts: number;
    totalStockQuantity: number;
    lowStockCount: number;
    outOfStockCount: number;
    stockAlertCount: number;
    totalSales: number;
    totalRevenue: number;
    todaySalesCount: number;
    todayRevenue: number;
    recentProducts: Product[];
    recentSales: Sale[];
  }>('/dashboard');
}

// Auth helpers kept for token/user persistence only (not business data)
export { getStoredAuthUser as getStoredCurrentUser, setStoredAuthUser as setStoredCurrentUser } from './api';
