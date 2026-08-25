import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { BarcodeScannerInput } from '../../components/pos/BarcodeScannerInput';
import { POSCart } from '../../components/pos/POSCart';
import { CheckoutModal } from '../../components/pos/CheckoutModal';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import { QuickProductLookupModal } from '../../components/pos/QuickProductLookupModal';
import { formatCurrency } from '../../lib/utils';
import { getStoredProducts, STORAGE_CHANGE_EVENT } from '../../services/storageService';
import { Product } from '../../types';
import {
  Search,
  Tag
} from 'lucide-react';

export const EmployeePOSPage: React.FC = () => {
  const { processBarcode, completedSale, setCompletedSale } = useCart();
  const { settings } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'low_stock'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const data = await getStoredProducts({ status: 'active' });
      setProducts(data.filter(p => p.status === 'active'));
    } catch {
      // Keep last known stock on refresh failure
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

  const inStockCount = products.filter(p => p.stock > 0).length;
  const totalCount = products.length;
  const lowCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStock = true;
    if (filterStock === 'in_stock') matchesStock = product.stock > 0;
    else if (filterStock === 'low_stock') matchesStock = product.stock > 0 && product.stock <= 5;

    return matchesSearch && matchesStock;
  });

  const getColorHex = (colorName: string) => {
    const name = colorName.toLowerCase();
    if (name.includes('black')) return '#111827';
    if (name.includes('white')) return '#FFFFFF';
    if (name.includes('indigo') || name.includes('navy')) return '#1E3A8A';
    if (name.includes('blue')) return '#2563EB';
    if (name.includes('red') || name.includes('crimson')) return '#DC2626';
    if (name.includes('green') || name.includes('olive')) return '#16A34A';
    if (name.includes('beige') || name.includes('cream')) return '#F5F5DC';
    if (name.includes('pink') || name.includes('rose')) return '#F43F5E';
    if (name.includes('gray') || name.includes('grey')) return '#6B7280';
    if (name.includes('brown')) return '#78350F';
    return '#9CA3AF';
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Main Left Section */}
      <section className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
        {/* Top Barcode Entry Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm shrink-0">
          <BarcodeScannerInput autoFocus={true} />
        </div>

        {/* Live Available Inventory Stock Card */}
        <div className="bg-white flex-1 rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden min-h-0">
          {/* Table Header with Filters */}
          <div className="p-4 border-b bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-sm uppercase tracking-widest text-gray-500">
                Available Inventory Stock
              </h2>
              <span className="text-[10px] text-gray-400 font-medium">
                (Click any row to add to cart)
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Inline Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter stock..."
                  className="pl-8 pr-3 py-1 bg-white border border-gray-200 rounded-full text-xs focus:ring-1 focus:ring-black outline-none w-36"
                />
              </div>

              {/* Status Pills */}
              <button
                type="button"
                onClick={() => setFilterStock('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  filterStock === 'all'
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                All ({totalCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterStock('in_stock')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all text-nowrap ${
                  filterStock === 'in_stock'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100'
                }`}
              >
                In Stock ({inStockCount})
              </button>

              {lowCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterStock('low_stock')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all text-nowrap ${
                    filterStock === 'low_stock'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100'
                  }`}
                >
                  Low Stock ({lowCount})
                </button>
              )}
            </div>
          </div>

          {/* Stock Table */}
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 border-b text-[10px] uppercase font-bold text-gray-400 tracking-wider z-10 shadow-2xs">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">SKU / Barcode</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Color / Size</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <Tag className="w-6 h-6 mx-auto mb-1.5 text-gray-300" />
                      <p className="font-semibold text-gray-600">No stock matching filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const isLow = product.stock > 0 && product.stock <= 5;
                    const isOut = product.stock <= 0;
                    const hex = getColorHex(product.color);

                    return (
                      <tr
                        key={product.id}
                        onClick={() => {
                          void processBarcode(product.barcode);
                        }}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors group ${
                          isOut ? 'opacity-50' : ''
                        }`}
                        title={isOut ? 'Out of stock' : 'Click to add item to bill'}
                      >
                        <td className="px-4 py-3 font-bold text-gray-900 group-hover:text-black">
                          <div className="flex items-center gap-2">
                            <span>{product.name}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono text-xs text-gray-600">
                          {product.barcode}
                        </td>

                        <td className="px-4 py-3 text-gray-600 font-medium">
                          {product.category}
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          <span className="inline-flex items-center">
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full mr-2 border border-gray-300 shrink-0"
                              style={{ backgroundColor: hex }}
                            />
                            <span>{product.color} / {product.size}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          {isOut ? (
                            <span className="text-rose-600 font-bold uppercase text-[10px]">
                              Out (0)
                            </span>
                          ) : isLow ? (
                            <span className="text-orange-600 font-bold uppercase text-[10px]">
                              Low ({product.stock})
                            </span>
                          ) : (
                            <span className="text-gray-600 font-medium">
                              {product.stock}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 text-sm">
                          {formatCurrency(product.sellingPrice, settings.currencySymbol)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Right Drawer: Pinned Current Sale POS Cart */}
      <aside className="w-[380px] bg-white border-l border-gray-200 flex flex-col shadow-2xl shrink-0 h-full overflow-hidden">
        <POSCart
          onOpenCheckout={() => setIsCheckoutOpen(true)}
          onOpenLookup={() => setIsLookupOpen(true)}
        />
      </aside>

      {/* Modals */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />

      <ReceiptModal
        sale={completedSale}
        isOpen={!!completedSale}
        onClose={() => setCompletedSale(null)}
      />

      <QuickProductLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
      />
    </div>
  );
};
