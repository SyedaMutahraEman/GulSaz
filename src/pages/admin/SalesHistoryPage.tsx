import React, { useState, useEffect, useCallback } from 'react';
import { Sale } from '../../types';
import {
  getStoredSales,
  STORAGE_CHANGE_EVENT
} from '../../services/storageService';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import { ReceiptModal } from '../../components/receipt/ReceiptModal';
import {
  ReceiptText,
  Search,
  Eye
} from 'lucide-react';

export const SalesHistoryPage: React.FC = () => {
  const { settings } = useSettings();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'online'>('all');

  const loadSales = useCallback(async () => {
    try {
      const data = await getStoredSales();
      setSales(data);
    } catch {
      // Keep last known sales on refresh failure
    }
  }, []);

  useEffect(() => {
    void loadSales();
    const onChange = () => {
      void loadSales();
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, onChange);
  }, [loadSales]);

  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      sale.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      sale.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      sale.items.some(i => i.productName.toLowerCase().includes(search.toLowerCase()) || i.barcode.includes(search));

    const matchesPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  const totalGrossRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalItemsSold = sales.reduce((sum, s) => sum + s.items.reduce((isum, i) => isum + i.quantity, 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-gray-900 flex items-center gap-2.5">
            <ReceiptText className="w-5 h-5 text-gray-700" />
            <span>Customer Sales & Invoices Log</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Complete transaction register. Click any invoice to inspect or reprint customer receipts.
          </p>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Sales Invoices</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{sales.length}</div>
          <div className="text-[10px] text-gray-500">Completed counter transactions</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Gross Items Sold</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{totalItemsSold}</div>
          <div className="text-[10px] text-gray-500">Units processed through POS</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Gross Sales Revenue</div>
          <div className="text-2xl font-mono font-black text-emerald-700 mt-1">
            {formatCurrency(totalGrossRevenue, settings.currencySymbol)}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Recorded across all registers</div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number (e.g. INV-000101), cashier name, garment item..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 focus:bg-white border border-gray-200 focus:ring-1 focus:ring-black rounded-lg text-xs outline-none transition-colors"
          />
        </div>

        <div className="flex items-center bg-gray-50 p-0.5 rounded-lg border border-gray-200 text-xs self-start sm:self-auto">
          <button
            onClick={() => setPaymentFilter('all')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              paymentFilter === 'all' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPaymentFilter('cash')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              paymentFilter === 'cash' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cash
          </button>
          <button
            onClick={() => setPaymentFilter('card')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              paymentFilter === 'card' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Card
          </button>
          <button
            onClick={() => setPaymentFilter('online')}
            className={`px-3 py-1 rounded font-semibold transition-all ${
              paymentFilter === 'online' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Online
          </button>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-3">Mode</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <ReceiptText className="w-7 h-7 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600">No sale records found</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-gray-900 text-xs group-hover:underline">
                        {sale.invoiceNumber}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      <div>{formatDate(sale.createdAt)}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{formatTime(sale.createdAt)}</div>
                    </td>

                    <td className="py-3 px-4 font-medium text-gray-800">
                      {sale.employeeName}
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-gray-900 font-semibold truncate max-w-xs">
                        {sale.items.map(i => `${i.productName} (${i.size}) x${i.quantity}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {sale.items.reduce((sum, i) => sum + i.quantity, 0)} units
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-bold uppercase rounded text-[10px] border border-gray-200">
                        {sale.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-black text-sm text-gray-900">
                        {formatCurrency(sale.total, settings.currencySymbol)}
                      </div>
                      {sale.discount > 0 && (
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Disc: {formatCurrency(sale.discount, settings.currencySymbol)}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedSale(sale)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-bold transition-colors inline-flex items-center gap-1"
                        title="View / Reprint Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        sale={selectedSale}
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
      />
    </div>
  );
};
