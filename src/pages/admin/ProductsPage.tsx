import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '../../types';
import {
  getStoredProducts,
  deleteProduct,
  STORAGE_CHANGE_EVENT
} from '../../services/storageService';
import { ProductListTable } from '../../components/products/ProductListTable';
import { AddProductModal } from '../../components/products/AddProductModal';
import { EditProductModal } from '../../components/products/EditProductModal';
import { BarcodeTagModal } from '../../components/barcode/BarcodeTagModal';
import { Plus, Shirt } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductForTag, setSelectedProductForTag] = useState<Product | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const data = await getStoredProducts();
      setProducts(data);
    } catch {
      // Keep last known list on refresh failure
    }
  }, []);

  useEffect(() => {
    void loadProducts();
    const onChange = () => {
      void loadProducts();
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, onChange);
  }, [loadProducts]);

  const handleProductCreated = (newProduct: Product) => {
    void loadProducts();
    setSelectedProductForTag(newProduct);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch {
      // Delete failed; list stays unchanged
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-gray-900 flex items-center gap-2.5">
            <Shirt className="w-5 h-5 text-gray-700" />
            <span>Garment Products & Barcodes</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage inventory catalog, automatic barcode tags, pricing, and sizing
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          id="products-page-add-btn"
          className="px-4 py-2 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Garment Product</span>
        </button>
      </div>

      {/* Product List Table */}
      <ProductListTable
        products={products}
        onEdit={(prod) => setEditingProduct(prod)}
        onDelete={(id) => {
          void handleDelete(id);
        }}
        onPrintTag={(prod) => setSelectedProductForTag(prod)}
      />

      {/* Modals */}
      <AddProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onProductCreated={handleProductCreated}
      />

      <EditProductModal
        product={editingProduct}
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        onProductUpdated={() => {
          void loadProducts();
        }}
      />

      <BarcodeTagModal
        product={selectedProductForTag}
        isOpen={!!selectedProductForTag}
        onClose={() => setSelectedProductForTag(null)}
      />
    </div>
  );
};
