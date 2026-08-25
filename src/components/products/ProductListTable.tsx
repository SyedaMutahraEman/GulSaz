import React, { useState } from 'react';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { BarcodeRenderer } from '../barcode/BarcodeRenderer';
import {
  Printer,
  Edit2,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  Tag
} from 'lucide-react';

interface ProductListTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onPrintTag: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
}

export const ProductListTable: React.FC<ProductListTableProps> = ({
  products,
  onEdit,
  onDelete,
  onPrintTag,
  onViewDetails
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { settings } = useSettings();

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

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

  // Filtering
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.barcode.includes(search) ||
      product.color.toLowerCase().includes(search.toLowerCase()) ||
      product.size.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = product.stock > 5;
    else if (stockFilter === 'low_stock') matchesStock = product.stock > 0 && product.stock <= 5;
    else if (stockFilter === 'out_of_stock') matchesStock = product.stock <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'price') cmp = a.sellingPrice - b.sellingPrice;
    else if (sortBy === 'stock') cmp = a.stock - b.stock;
    else if (sortBy === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (field: 'name' | 'price' | 'stock' | 'date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by name, barcode number, size, color..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-white focus:bg-white border border-gray-200 focus:ring-1 focus:ring-black rounded-lg text-xs transition-colors outline-none"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              &times;
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-medium text-gray-800 focus:outline-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div className="flex items-center bg-gray-50 p-0.5 rounded-lg border border-gray-200 text-xs">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                stockFilter === 'all' ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('in_stock')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                stockFilter === 'in_stock' ? 'bg-emerald-700 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStockFilter('low_stock')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                stockFilter === 'low_stock' ? 'bg-amber-500 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Low (≤5)
            </button>
            <button
              onClick={() => setStockFilter('out_of_stock')}
              className={`px-2.5 py-1 rounded font-semibold transition-all ${
                stockFilter === 'out_of_stock' ? 'bg-rose-600 text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Out (0)
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                <th className="py-3 px-4">Garment Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-3">Color / Size</th>
                <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort('price')}>
                  <div className="flex items-center gap-1">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer select-none" onClick={() => toggleSort('stock')}>
                  <div className="flex items-center gap-1">
                    <span>Stock</span>
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Barcode Tag</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Tag className="w-7 h-7 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-gray-600">No products matching the criteria</p>
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= 5;
                  const hex = getColorHex(product.color);

                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center font-mono font-bold text-xs text-gray-700 shrink-0">
                            {product.size}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate max-w-[200px]">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {product.barcode}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 font-semibold rounded text-[10px] uppercase tracking-wider">
                          {product.category}
                        </span>
                      </td>

                      {/* Size & Color */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center text-xs font-medium text-gray-700">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full mr-2 border border-gray-300 shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                          <span>{product.color} &bull; {product.size}</span>
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-gray-900 text-sm">
                          {formatCurrency(product.sellingPrice, settings.currencySymbol)}
                        </div>
                      </td>

                      {/* Stock with Status Badges */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-900 text-sm">
                            {product.stock}
                          </span>
                          <span className="text-gray-400 text-[10px]">pcs</span>
                        </div>

                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded mt-0.5 uppercase">
                            Out
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded mt-0.5 uppercase">
                            Low ({product.stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 uppercase">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Barcode Graphic Thumbnail */}
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
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Barcode Tag */}
                          <button
                            type="button"
                            onClick={() => onPrintTag(product)}
                            className="p-1.5 text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            title="View & Print Barcode Hangtag"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Product */}
                          <button
                            type="button"
                            onClick={() => onEdit(product)}
                            className="p-1.5 text-gray-600 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Edit Product Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Product */}
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(product.id, product.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <div>
            Showing <span className="font-bold text-gray-900">{sortedProducts.length}</span> of{' '}
            <span className="font-bold text-gray-900">{products.length}</span> styles
          </div>
          <div className="flex items-center gap-4">
            <span>Total Stock Value: <strong className="text-gray-900 font-mono">{formatCurrency(products.reduce((s, p) => s + (p.sellingPrice * p.stock), 0), settings.currencySymbol)}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
