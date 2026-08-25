import React, { useState, useEffect, useCallback } from 'react';
import { Product, Sale } from '../../types';
import {
  getDashboard,
  STORAGE_CHANGE_EVENT
} from '../../services/storageService';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { BarcodeTagModal } from '../../components/barcode/BarcodeTagModal';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import { AddProductModal } from '../../components/products/AddProductModal';
import {
  Shirt,
  Boxes,
  AlertTriangle,
  Receipt,
  TrendingUp,
  DollarSign,
  Plus,
  Printer,
  ArrowRight,
  Eye,
  ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { settings } = useSettings();
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalStockItems, setTotalStockItems] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState(0);
  const [outOfStockProducts, setOutOfStockProducts] = useState(0);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todaySalesCount, setTodaySalesCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  const [selectedProductForTag, setSelectedProductForTag] = useState<Product | null>(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const dash = await getDashboard();
      setTotalProducts(dash.totalProducts);
      setTotalStockItems(dash.totalStockQuantity);
      setLowStockProducts(dash.lowStockCount);
      setOutOfStockProducts(dash.outOfStockCount);
      setTotalSalesCount(dash.totalSales);
      setTotalRevenue(dash.totalRevenue);
      setTodaySalesCount(dash.todaySalesCount);
      setTodayRevenue(dash.todayRevenue);
      setRecentProducts(dash.recentProducts);
      setRecentSales(dash.recentSales);
    } catch {
      // Keep last known dashboard values on refresh failure
    }
  }, []);

  useEffect(() => {
    void loadData();
    const onChange = () => {
      void loadData();
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, onChange);
  }, [loadData]);

  const handleProductCreated = (newProd: Product) => {
    void loadData();
    setSelectedProductForTag(newProd);
  };

  return (
    <div className="space-y-6">
      {/* Top Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-gray-900">
            Store Overview & Inventory
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time stock levels, barcode generation, and live counter sales tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddProductOpen(true)}
            id="admin-add-product-btn"
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Garment Stock</span>
          </button>

          <Link
            to="/pos"
            className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-50 text-black font-bold text-xs rounded-lg transition-all flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Products */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Products</span>
            <Shirt className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">{totalProducts}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-medium">In catalog</div>
        </div>

        {/* Total Physical Stock Items */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Stock</span>
            <Boxes className="w-4 h-4 text-gray-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{totalStockItems}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-medium">Total units</div>
        </div>

        {/* Low / Out Stock Alert */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stock Alert</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{lowStockProducts + outOfStockProducts}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-medium">
            {outOfStockProducts > 0 ? `${outOfStockProducts} out` : 'Low (≤5)'}
          </div>
        </div>

        {/* Total Sales Count */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Invoices</span>
            <Receipt className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-black text-gray-900">{totalSalesCount}</div>
          <div className="text-[10px] text-gray-500 mt-1 font-medium">Bills created</div>
        </div>

        {/* Today's Sales Revenue */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Today</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black font-mono text-emerald-700 truncate">
            {formatCurrency(todayRevenue, settings.currencySymbol)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-medium">{todaySalesCount} bills today</div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Revenue</span>
            <DollarSign className="w-4 h-4 text-gray-800" />
          </div>
          <div className="text-lg font-black font-mono text-gray-900 truncate">
            {formatCurrency(totalRevenue, settings.currencySymbol)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1 font-medium">Gross sales</div>
        </div>
      </div>

      {/* Main Dual Grid: Recent Products & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Recent Products Added</h2>
              <p className="text-[10px] text-gray-400">Auto-generated barcodes ready to print</p>
            </div>
            <Link
              to="/admin/products"
              className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 flex-1">
            {recentProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No products added yet. Click "Add Garment Stock" to start.
              </div>
            ) : (
              recentProducts.map(product => (
                <div key={product.id} className="p-3 hover:bg-gray-50 flex items-center justify-between gap-3 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center font-mono font-bold text-[10px] text-gray-600 shrink-0 border border-gray-200">
                      {product.size}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-gray-900 truncate">
                        {product.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                        <span className="font-medium text-gray-600">{product.color}</span>
                        <span>&bull;</span>
                        <span className="font-mono text-gray-400">{product.barcode}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-gray-900">
                        {formatCurrency(product.sellingPrice, settings.currencySymbol)}
                      </div>
                      <div className={`text-[10px] font-semibold ${product.stock > 5 ? 'text-emerald-700' : product.stock > 0 ? 'text-amber-700' : 'text-rose-700'}`}>
                        {product.stock} in stock
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedProductForTag(product)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      title="Print Barcode Hangtag"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">Recent Customer Bills</h2>
              <p className="text-[10px] text-gray-400">Live transaction feed and invoice lookup</p>
            </div>
            <Link
              to="/admin/sales"
              className="text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100 flex-1">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No sales recorded yet. Open POS to process customer sales.
              </div>
            ) : (
              recentSales.map(sale => (
                <div key={sale.id} className="p-3 hover:bg-gray-50 flex items-center justify-between gap-3 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-gray-900">{sale.invoiceNumber}</span>
                      <span className="text-[9px] uppercase font-bold bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded border border-gray-200">
                        {sale.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Cashier: <strong className="text-gray-700">{sale.employeeName}</strong> &bull;{' '}
                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-black text-sm text-gray-900">
                        {formatCurrency(sale.total, settings.currencySymbol)}
                      </div>
                      <div className="text-[9px] text-gray-400 font-mono">
                        {formatDate(sale.createdAt)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSaleForReceipt(sale)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      title="View & Reprint Receipt"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <BarcodeTagModal
        product={selectedProductForTag}
        isOpen={!!selectedProductForTag}
        onClose={() => setSelectedProductForTag(null)}
      />

      <ReceiptModal
        sale={selectedSaleForReceipt}
        isOpen={!!selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onProductCreated={handleProductCreated}
      />
    </div>
  );
};
