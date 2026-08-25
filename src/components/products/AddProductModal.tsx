import React, { useState, useEffect } from 'react';
import { Product, ProductCategory, ProductSize } from '../../types';
import { addProduct, getCategories } from '../../services/storageService';
import { useSettings } from '../../context/SettingsContext';
import { X, Sparkles, Image as ImageIcon, Check, Tag } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (newProduct: Product) => void;
}

const FALLBACK_CATEGORIES: ProductCategory[] = [
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

const PRESET_IMAGES = [
  { label: 'Embroidered Abaya', url: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=600&auto=format&fit=crop&q=80' },
  { label: 'Dubai Cut Abaya', url: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=600&auto=format&fit=crop&q=80' },
  { label: 'Formal Silk Suite', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80' },
  { label: 'Zari Organza Kurta', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80' },
  { label: 'Linen Co-ord Set', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80' },
  { label: 'Everyday Lawn Kurti', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80' },
  { label: 'Chiffon Silk Stole', url: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600&auto=format&fit=crop&q=80' }
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onProductCreated
}) => {
  const { settings } = useSettings();

  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(FALLBACK_CATEGORIES[0]);
  const [size, setSize] = useState<ProductSize>('M');
  const [color, setColor] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await getCategories();
        const names = data.filter((c) => c.isActive).map((c) => c.name);
        if (!cancelled && names.length > 0) {
          setCategories(names);
          setCategory((prev) => (names.includes(prev) ? prev : names[0]));
        }
      } catch {
        if (!cancelled) setCategories(FALLBACK_CATEGORIES);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
      const created = await addProduct({
        name: name.trim(),
        category: category as ProductCategory,
        size,
        color: color.trim(),
        description: description.trim() || undefined,
        image: image || undefined,
        purchasePrice: purchasePrice ? Number(purchasePrice) : Math.round(Number(sellingPrice) * 0.5),
        sellingPrice: Number(sellingPrice),
        stock: Number(stock),
      });

      setName('');
      setColor('');
      setDescription('');
      setPurchasePrice('');
      setSellingPrice('');
      setStock(0);
      setError(null);

      onProductCreated(created);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
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
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-neutral-800 rounded-lg text-amber-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">Add New Physical Stock Product</h3>
              <p className="text-xs text-neutral-400">Unique retail barcode will be auto-generated upon saving</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={(e) => { void handleSubmit(e); }} className="overflow-y-auto flex-1 p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 pb-1 border-b border-neutral-100">
              1. Garment & Style Details
            </h4>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Classic Heavyweight Crewneck Tee, Selvedge Denim, etc."
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:border-neutral-900"
                >
                  {categories.map(cat => (
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
                  placeholder="e.g. Jet Black, Olive, Khaki"
                  className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:border-neutral-900"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">Fabric & Style Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="100% organic cotton, 240 GSM, relaxed fit..."
                rows={2}
                className="w-full px-3.5 py-2 bg-white border border-neutral-300 rounded-xl text-xs font-normal text-neutral-900 focus:border-neutral-900"
              />
            </div>
          </div>

          {/* Section 2: Pricing & Physical Stock */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 pb-1 border-b border-neutral-100">
              2. Pricing & Stock Inventory
            </h4>

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
                  placeholder="e.g. 2999"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-mono font-bold text-neutral-900 focus:border-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Cost / Purchase Price ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="e.g. 1400"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-mono text-neutral-700 focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 block mb-1">
                  Initial Stock Quantity <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  placeholder="e.g. 10"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-xl text-sm font-mono font-bold text-neutral-900 focus:border-neutral-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Product Image (Presets or URL) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 pb-1 border-b border-neutral-100 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              3. Garment Image
            </h4>

            <div className="flex items-center gap-3">
              <img
                src={image}
                alt="Product preview"
                className="w-16 h-16 rounded-xl object-cover border-2 border-neutral-200 bg-neutral-100 shrink-0"
              />
              <div className="flex-1 space-y-1.5">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="Paste direct image URL or choose preset below"
                  className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_IMAGES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImage(preset.url)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        image === preset.url
                          ? 'bg-neutral-900 text-white border-neutral-900'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Auto Barcode Notice */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold">Automatic Barcode Generation</span>
              <p className="text-[11px] text-amber-800">
                You do not need to type a barcode. A unique machine-readable retail barcode tag will be generated automatically upon saving, ready to print!
              </p>
            </div>
          </div>

          {/* Form Actions */}
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
              id="save-product-submit-btn"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Product & Generate Barcode'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
