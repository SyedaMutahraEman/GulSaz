import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, ProductSize } from '../../types';
import { updateProduct, updateProductStock } from '../../services/storageService';
import { useSettings } from '../../context/SettingsContext';
import { X, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { BarcodeRenderer } from '../barcode/BarcodeRenderer';

interface EditProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated?: (updated: Product) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Abayas',
  'Formal',
  'Casual Wear',
  'Stoles & Hijabs',
  'Co-ords & Sets',
  'Festive Pret',
  'Accessories'
];

const SIZES: ProductSize[] = [
  '50', '52', '54', '56', '58',
  'XS', 'S', 'M', 'L', 'XL', 'XXL',
  'Free Size', 'Standard'
];

export const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onProductUpdated
}) => {
  const { settings } = useSettings();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Abayas');
  const [size, setSize] = useState<ProductSize>('M');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(0);
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product && isOpen) {
      setName(product.name);
      setCategory(product.category as ProductCategory);
      setSize(product.size as ProductSize);
      setColor(product.color);
      setDescription(product.description || '');
      setImage(product.image || '');
      setPurchasePrice(product.purchasePrice);
      setSellingPrice(product.sellingPrice);
      setStock(product.stock);
      setBarcode(product.barcode);
      setError(null);
      setIsSubmitting(false);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleRegenerateBarcode = () => {
    if (window.confirm('Regenerating barcode will assign a new code to this product and invalidate existing printed physical tags. Proceed?')) {
      setBarcode(`GS${Date.now().toString().slice(-10)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Product name is required');
      return;
    }
    if (!color.trim()) {
      setError('Product color is required');
      return;
    }
    if (sellingPrice === '' || Number(sellingPrice) <= 0) {
      setError('Valid selling price is required');
      return;
    }
    if (stock === '' || Number(stock) < 0) {
      setError('Stock quantity cannot be negative');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let updated = await updateProduct(product.id, {
        name: name.trim(),
        category,
        size,
        color: color.trim(),
        description: description.trim() || undefined,
        image: image || undefined,
        purchasePrice: purchasePrice !== '' ? Number(purchasePrice) : product.purchasePrice,
        sellingPrice: Number(sellingPrice),
        barcode: barcode.trim()
      });

      if (!updated) {
        setError('Failed to update product');
        return;
      }

      if (Number(stock) !== product.stock) {
        const stockUpdated = await updateProductStock(product.id, Number(stock));
        if (stockUpdated) {
          updated = stockUpdated;
        }
      }

      if (onProductUpdated) {
        onProductUpdated(updated);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm print:hidden">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
          <div>
            <h3 className="text-base font-bold">Edit Garment Product</h3>
            <p className="text-xs text-neutral-400">Update stock inventory, prices, and specifications</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { void handleSubmit(e); }} className="overflow-y-auto flex-1 p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Barcode details with preserved code */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">Assigned Barcode</span>
              <span className="text-sm font-mono font-bold text-neutral-900">{barcode}</span>
              <p className="text-[11px] text-neutral-500">Associated tag preserved across edits</p>
            </div>
            <div className="flex items-center gap-3">
              <BarcodeRenderer value={barcode} width={1.2} height={32} fontSize={10} />
              <button
                type="button"
                onClick={handleRegenerateBarcode}
                className="px-2.5 py-1.5 bg-white border border-neutral-300 hover:border-neutral-400 text-neutral-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                title="Regenerate only if needed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:border-neutral-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:border-neutral-900"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as ProductSize)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:border-neutral-900"
                >
                  {SIZES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Color <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:border-neutral-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Selling Price ({settings.currencySymbol}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-mono font-bold text-neutral-900 focus:border-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Purchase / Cost Price ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-mono text-neutral-700 focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Stock in Store <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-mono font-bold text-neutral-900 focus:border-neutral-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Image URL</label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="Image URL"
                className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-normal text-neutral-900 focus:border-neutral-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
