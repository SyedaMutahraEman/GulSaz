import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { Scan, CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { getStoredProducts } from '../../services/storageService';
import { Product } from '../../types';

interface BarcodeScannerInputProps {
  autoFocus?: boolean;
}

export const BarcodeScannerInput: React.FC<BarcodeScannerInputProps> = ({ autoFocus = true }) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { processBarcode, scanFeedback, clearFeedback } = useCart();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const products = await getStoredProducts({ status: 'active', limit: 6 });
        if (!cancelled) {
          setRecentProducts(products.filter(p => p.status === 'active').slice(0, 6));
        }
      } catch {
        if (!cancelled) setRecentProducts([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    await processBarcode(code);
    setBarcodeInput('');

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleQuickChipScan = async (barcode: string) => {
    await processBarcode(barcode);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="space-y-3">
      {/* Scanner / Manual Entry Form */}
      <form onSubmit={(e) => { void handleSubmit(e); }} className="relative">
        <label className="block text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">
          Barcode Scanner / Manual Entry
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-gray-400">
              <Scan className="w-4 h-4 text-gray-500" />
            </div>
            <input
              ref={inputRef}
              type="text"
              id="barcode-scanner-input"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan barcode with scanner or enter code (e.g. NV-882-BLK-M)..."
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono tracking-wider font-semibold text-gray-900 focus:ring-2 focus:ring-black focus:border-black outline-none transition-all placeholder:font-sans placeholder:font-normal placeholder:text-gray-400"
              autoComplete="off"
              spellCheck="false"
            />
            {barcodeInput && (
              <button
                type="button"
                onClick={() => setBarcodeInput('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            id="barcode-manual-add-btn"
            disabled={!barcodeInput.trim()}
            className="bg-black text-white px-6 py-2.5 rounded-lg font-bold text-xs hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <span>Add Item</span>
          </button>
        </div>
      </form>

      {/* Live Scan Feedback Banner */}
      {scanFeedback && (
        <div
          className={`px-3.5 py-2.5 rounded-lg border flex items-start justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-150 ${
            scanFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : scanFeedback.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-start gap-2">
            {scanFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />}
            {scanFeedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />}
            {scanFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />}
            <div>
              <span className="font-bold block">{scanFeedback.title}</span>
              <span className="text-[11px] opacity-90">{scanFeedback.message}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={clearFeedback}
            className="text-gray-400 hover:text-gray-700 p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Quick Test Barcode Pills */}
      {recentProducts.length > 0 && (
        <div className="pt-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Quick Scans:
            </span>
            {recentProducts.map(product => (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  void handleQuickChipScan(product.barcode);
                }}
                className={`text-[11px] px-2 py-0.5 rounded border font-mono transition-all flex items-center gap-1 ${
                  product.stock <= 0
                    ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-60'
                    : 'bg-white hover:bg-gray-100 border-gray-200 text-gray-700 shadow-2xs'
                }`}
                title={`Stock: ${product.stock} units`}
              >
                <span className="font-sans font-medium">{product.name} ({product.size})</span>
                <span className="text-gray-300 font-bold">&bull;</span>
                <span className="text-gray-500 font-semibold">{product.barcode.slice(-4)}</span>
                {product.stock <= 0 && <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded">Out</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
