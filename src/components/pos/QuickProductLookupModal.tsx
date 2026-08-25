import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { getStoredProducts } from '../../services/storageService';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { Search, X, Plus, AlertCircle } from 'lucide-react';

interface QuickProductLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickProductLookupModal: React.FC<QuickProductLookupModalProps> = ({
  isOpen,
  onClose
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const { addProductToCart } = useCart();
  const { settings } = useSettings();

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await getStoredProducts({ status: 'active' });
        if (!cancelled) {
          setProducts(data.filter(p => p.status === 'active'));
        }
      } catch {
        if (!cancelled) setProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.color.toLowerCase().includes(search.toLowerCase()) ||
      p.size.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAdd = async (product: Product) => {
    await addProductToCart(product);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm print:hidden">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
          <div>
            <h3 className="text-base font-bold">Quick Stock Inventory Lookup</h3>
            <p className="text-xs text-neutral-400">Search available sizes, colors, and prices</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, size (e.g. M, 32), color, barcode..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-300 rounded-xl text-xs focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-neutral-100">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
              <p className="text-sm font-semibold text-neutral-600">No matching products found</p>
              <p className="text-xs text-neutral-400 mt-0.5">Try searching with a different keyword</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(product => {
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      isOutOfStock
                        ? 'bg-neutral-50/60 border-neutral-200 opacity-60'
                        : 'bg-white border-neutral-200 hover:border-neutral-400 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-neutral-100 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-400 shrink-0">
                          CLOTH
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-neutral-900 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-semibold bg-neutral-100 text-neutral-800 px-1.5 py-0.2 rounded">
                            {product.size}
                          </span>
                          <span className="text-[11px] text-neutral-500 truncate">
                            {product.color}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono font-bold text-neutral-900">
                            {formatCurrency(product.sellingPrice, settings.currencySymbol)}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              product.stock > 5
                                ? 'bg-emerald-100 text-emerald-800'
                                : product.stock > 0
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        void handleAdd(product);
                      }}
                      disabled={isOutOfStock}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                        isOutOfStock
                          ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
                      }`}
                      title={isOutOfStock ? 'Out of stock' : 'Add to bill'}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center text-xs text-neutral-500">
          <span>Showing {filtered.length} products</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
