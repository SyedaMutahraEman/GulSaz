import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '../../types';
import {
  getStoredProducts,
  updateProductStock,
  STORAGE_CHANGE_EVENT
} from '../../services/storageService';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/utils';
import { BarcodeRenderer } from '../../components/barcode/BarcodeRenderer';
import { BarcodeTagModal } from '../../components/barcode/BarcodeTagModal';
import {
  Boxes,
  Search,
  Printer,
  Plus,
  Minus,
  Save,
  Check
} from 'lucide-react';

export const StockPage: React.FC = () => {
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedProductForTag, setSelectedProductForTag] = useState<Product | null>(null);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInputVal, setStockInputVal] = useState<number>(0);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

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

  const handleStockAdjustment = async (productId: string, delta: number) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const newStock = Math.max(0, p.stock + delta);
    try {
      await updateProductStock(productId, newStock);
      await loadProducts();
    } catch {
      // Stock adjust failed
    }
  };

  const handleStartEditing = (product: Product) => {
    setEditingStockId(product.id);
    setStockInputVal(product.stock);
  };

  const handleSaveStockInput = async (productId: string) => {
    try {
      await updateProductStock(productId, stockInputVal);
      setEditingStockId(null);
      setSaveSuccessId(productId);
      setTimeout(() => setSaveSuccessId(null), 1500);
      await loadProducts();
    } catch {
      // Stock save failed
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.barcode.includes(search) ||
      product.color.toLowerCase().includes(search.toLowerCase()) ||
      product.size.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase());

    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = product.stock > 5;
    else if (stockFilter === 'low_stock') matchesStock = product.stock > 0 && product.stock <= 5;
    else if (stockFilter === 'out_of_stock') matchesStock = product.stock <= 0;

    return matchesSearch && matchesStock;
  });

  const totalStockCount = products.reduce((sum, p) => sum + p.stock, 0);
  const inStockCount = products.filter(p => p.stock > 5).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-gray-900 flex items-center gap-2.5">
            <Boxes className="w-5 h-5 text-gray-700" />
            <span>Store Physical Stock Inventory</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time physical stock counts. Stock automatically decreases upon completed sales.
          </p>
        </div>
      </div>

      {/* Stock Summary Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Units</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{totalStockCount}</div>
          <div className="text-[10px] text-gray-500">across {products.length} garments</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">In Stock (&gt;5)</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{inStockCount}</div>
          <div className="text-[10px] text-emerald-600 font-medium">Sufficient inventory</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Low Stock (1-5)</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{lowStockCount}</div>
          <div className="text-[10px] text-amber-600 font-medium">Reorder suggested</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Out of Stock (0)</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{outOfStockCount}</div>
          <div className="text-[10px] text-rose-600 font-medium">Restock needed</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stock by product name, barcode, size, color..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 focus:bg-white border border-gray-200 focus:ring-1 focus:ring-black rounded-lg text-xs outline-none transition-colors"
          />
        </div>

        <div className="flex items-center bg-gray-50 p-0.5 rounded-lg border border-gray-200 text-xs self-start sm:self-auto">
          <button
            onClick={() => setStockFilter('all')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              stockFilter === 'all' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setStockFilter('in_stock')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              stockFilter === 'in_stock' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            In Stock ({inStockCount})
          </button>
          <button
            onClick={() => setStockFilter('low_stock')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              stockFilter === 'low_stock' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setStockFilter('out_of_stock')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              stockFilter === 'out_of_stock' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-3 text-center">Size</th>
                <th className="py-3 px-3">Color</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Level & Adjust</th>
                <th className="py-3 px-4">Barcode Tag</th>
                <th className="py-3 px-4 text-right">Tag Print</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 5;
                  const isEditing = editingStockId === product.id;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center font-mono font-bold text-xs text-gray-700 shrink-0">
                            {product.size}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {product.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-black text-white font-mono font-bold rounded text-[10px]">
                          {product.size}
                        </span>
                      </td>

                      {/* Color */}
                      <td className="py-3 px-3">
                        <span className="text-gray-700 font-medium">{product.color}</span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-gray-900 text-sm">
                          {formatCurrency(product.sellingPrice, settings.currencySymbol)}
                        </div>
                      </td>

                      {/* Stock Level with +/- inline controls */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                value={stockInputVal}
                                onChange={(e) => setStockInputVal(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 px-2 py-1 bg-white border-2 border-black rounded font-mono font-bold text-xs"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  void handleSaveStockInput(product.id);
                                }}
                                className="p-1 bg-black text-white rounded hover:bg-gray-800"
                                title="Save quantity"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  void handleStockAdjustment(product.id, -1);
                                }}
                                disabled={product.stock <= 0}
                                className="w-6 h-6 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 rounded flex items-center justify-center font-bold text-xs"
                                title="Decrease by 1"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStartEditing(product)}
                                className="min-w-[40px] px-2 py-0.5 text-center font-mono font-black text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-900"
                                title="Click to manually enter exact stock"
                              >
                                {product.stock}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  void handleStockAdjustment(product.id, 1);
                                }}
                                className="w-6 h-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded flex items-center justify-center font-bold text-xs"
                                title="Increase by 1"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Status Badge */}
                          {saveSuccessId === product.id ? (
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-3 h-3" /> Updated
                            </span>
                          ) : isOutOfStock ? (
                            <span className="text-[9px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded uppercase">
                              Out
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded uppercase">
                              Low
                            </span>
                          ) : (
                            <span className="text-[9px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Barcode Renderer */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="bg-white p-1 rounded border border-gray-200 shrink-0">
                            <BarcodeRenderer
                              value={product.barcode}
                              width={0.9}
                              height={20}
                              fontSize={8}
                              displayValue={false}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-semibold text-gray-600">
                            {product.barcode}
                          </span>
                        </div>
                      </td>

                      {/* Tag Print Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedProductForTag(product)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded transition-colors inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Tags</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barcode Tag Modal */}
      <BarcodeTagModal
        product={selectedProductForTag}
        isOpen={!!selectedProductForTag}
        onClose={() => setSelectedProductForTag(null)}
      />
    </div>
  );
};
