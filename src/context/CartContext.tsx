import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product, Sale } from '../types';
import {
  getProductByBarcode,
  getProductById,
  executeSaleTransaction,
  STORAGE_CHANGE_EVENT,
  getStoredProducts,
} from '../services/storageService';
import { playBeep } from '../lib/utils';
import { useAuth } from './AuthContext';

export interface ScanFeedback {
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
  timestamp: number;
  product?: Product;
}

interface CartContextType {
  cart: CartItem[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  discount: number;
  discountPercent: number;
  setDiscountAmount: (amount: number) => void;
  setDiscountPercentage: (percent: number) => void;
  total: number;
  scanFeedback: ScanFeedback | null;
  clearFeedback: () => void;
  processBarcode: (barcode: string) => Promise<{ success: boolean; message: string; product?: Product }>;
  addProductToCart: (product: Product, quantity?: number) => Promise<{ success: boolean; message: string }>;
  updateItemQuantity: (productId: string, newQuantity: number) => Promise<{ success: boolean; message?: string }>;
  removeItemFromCart: (productId: string) => void;
  clearCart: () => void;
  completedSale: Sale | null;
  setCompletedSale: (sale: Sale | null) => void;
  finalizeSale: (paymentDetails: {
    paymentMethod: 'cash' | 'card' | 'online';
    amountPaid: number;
    notes?: string;
  }) => Promise<{ success: boolean; sale?: Sale; error?: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  useEffect(() => {
    const handleStorageChange = async () => {
      setCart((currentCart) => {
        if (currentCart.length === 0) return currentCart;
        // Refresh stock asynchronously without blocking UI
        void (async () => {
          try {
            const products = await getStoredProducts({ status: 'active' });
            setCart((latest) =>
              latest
                .map((item) => {
                  const fresh = products.find((p) => p.id === item.productId);
                  if (!fresh) return item;
                  const safeQty = Math.min(item.quantity, fresh.stock);
                  return {
                    ...item,
                    unitPrice: fresh.sellingPrice,
                    total: fresh.sellingPrice * safeQty,
                    maxStock: fresh.stock,
                    quantity: safeQty,
                  };
                })
                .filter((item) => item.maxStock > 0)
            );
          } catch {
            // keep current cart if refresh fails
          }
        })();
        return currentCart;
      });
    };

    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageChange);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageChange);
  }, []);

  const clearFeedback = () => setScanFeedback(null);

  const processBarcode = useCallback(async (rawBarcode: string): Promise<{
    success: boolean;
    message: string;
    product?: Product;
  }> => {
    const barcode = rawBarcode.trim();
    if (!barcode) {
      return { success: false, message: 'Please enter or scan a barcode' };
    }

    let product: Product | undefined;
    try {
      product = await getProductByBarcode(barcode);
    } catch {
      playBeep('error');
      const feedback: ScanFeedback = {
        type: 'error',
        title: 'Lookup Failed',
        message: 'Unable to look up barcode. Please try again.',
        timestamp: Date.now(),
      };
      setScanFeedback(feedback);
      return { success: false, message: feedback.message };
    }

    if (!product) {
      playBeep('error');
      const feedback: ScanFeedback = {
        type: 'error',
        title: 'Product Not Found',
        message: `No active product found for barcode: ${barcode}`,
        timestamp: Date.now(),
      };
      setScanFeedback(feedback);
      return { success: false, message: feedback.message };
    }

    if (product.stock <= 0) {
      playBeep('error');
      const feedback: ScanFeedback = {
        type: 'error',
        title: 'Out of Stock',
        message: `"${product.name}" (${product.size}/${product.color}) is out of stock.`,
        timestamp: Date.now(),
        product,
      };
      setScanFeedback(feedback);
      return { success: false, message: feedback.message, product };
    }

    let resultMessage = '';
    let success = false;

    setCart((currentCart) => {
      const existingIndex = currentCart.findIndex((item) => item.productId === product!.id);

      if (existingIndex > -1) {
        const existingItem = currentCart[existingIndex];
        if (existingItem.quantity >= product!.stock) {
          playBeep('error');
          resultMessage = `Cannot add more. Max available stock is ${product!.stock}.`;
          setScanFeedback({
            type: 'warning',
            title: 'Max Stock Reached',
            message: `Only ${product!.stock} units of "${product!.name}" available.`,
            timestamp: Date.now(),
            product,
          });
          return currentCart;
        }

        const newQty = existingItem.quantity + 1;
        const updatedCart = [...currentCart];
        updatedCart[existingIndex] = {
          ...existingItem,
          quantity: newQty,
          total: newQty * existingItem.unitPrice,
        };

        playBeep('success');
        success = true;
        resultMessage = `Increased quantity for "${product!.name}" to ${newQty}`;
        setScanFeedback({
          type: 'success',
          title: 'Quantity Increased',
          message: `${product!.name} (${product!.size}) — Qty: ${newQty}`,
          timestamp: Date.now(),
          product,
        });
        return updatedCart;
      }

      const newItem: CartItem = {
        productId: product!.id,
        productName: product!.name,
        barcode: product!.barcode,
        size: product!.size,
        color: product!.color,
        quantity: 1,
        unitPrice: product!.sellingPrice,
        total: product!.sellingPrice,
        maxStock: product!.stock,
        image: product!.image,
      };

      playBeep('success');
      success = true;
      resultMessage = `Added "${product!.name}" to cart`;
      setScanFeedback({
        type: 'success',
        title: 'Product Added',
        message: `${product!.name} (${product!.size}/${product!.color}) added to cart.`,
        timestamp: Date.now(),
        product,
      });
      return [newItem, ...currentCart];
    });

    return { success, message: resultMessage, product };
  }, []);

  const addProductToCart = useCallback(
    async (product: Product, _quantity: number = 1) => {
      return processBarcode(product.barcode);
    },
    [processBarcode]
  );

  const updateItemQuantity = useCallback(async (productId: string, newQuantity: number) => {
    const product = await getProductById(productId);
    if (!product) {
      return { success: false, message: 'Product not found in system' };
    }

    if (newQuantity <= 0) {
      setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
      return { success: true, message: 'Item removed from cart' };
    }

    if (newQuantity > product.stock) {
      playBeep('error');
      setScanFeedback({
        type: 'warning',
        title: 'Exceeds Stock',
        message: `Cannot set quantity to ${newQuantity}. Only ${product.stock} in stock.`,
        timestamp: Date.now(),
      });
      return { success: false, message: `Only ${product.stock} items available in stock` };
    }

    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.unitPrice,
          };
        }
        return item;
      })
    );

    return { success: true };
  }, []);

  const removeItemFromCart = useCallback((productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountPercent(0);
    setDiscountAmount(0);
    setScanFeedback(null);
  }, []);

  const setDiscountPercentage = (percent: number) => {
    const safePercent = Math.max(0, Math.min(100, percent));
    setDiscountPercent(safePercent);
    setDiscountAmount(0);
  };

  const setExplicitDiscountAmount = (amount: number) => {
    setDiscountAmount(Math.max(0, amount));
    setDiscountPercent(0);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const calculatedDiscount =
    discountPercent > 0 ? (subtotal * discountPercent) / 100 : Math.min(subtotal, discountAmount);
  const total = Math.max(0, subtotal - calculatedDiscount);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const itemCount = cart.length;

  const finalizeSale = async (paymentDetails: {
    paymentMethod: 'cash' | 'card' | 'online';
    amountPaid: number;
    notes?: string;
  }) => {
    if (cart.length === 0) {
      return { success: false, error: 'Cart is empty. Please scan products before completing sale.' };
    }

    if (!currentUser) {
      return { success: false, error: 'You must be logged in to complete a sale.' };
    }

    const result = await executeSaleTransaction({
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      discount: discountPercent > 0 ? undefined : calculatedDiscount,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      paymentMethod: paymentDetails.paymentMethod,
      amountPaid: paymentDetails.amountPaid,
      notes: paymentDetails.notes,
    });

    if (result.success && result.sale) {
      setCompletedSale(result.sale);
      clearCart();
    }

    return result;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        totalQuantity,
        subtotal,
        discount: calculatedDiscount,
        discountPercent,
        setDiscountAmount: setExplicitDiscountAmount,
        setDiscountPercentage,
        total,
        scanFeedback,
        clearFeedback,
        processBarcode,
        addProductToCart,
        updateItemQuantity,
        removeItemFromCart,
        clearCart,
        completedSale,
        setCompletedSale,
        finalizeSale,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
