import React, { useState } from 'react';
import { Product } from '../../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { formatCurrency } from '../../lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { Printer, X, Tag, Copy, Check, Sparkles } from 'lucide-react';

interface BarcodeTagModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  initialQuantity?: number;
}

export const BarcodeTagModal: React.FC<BarcodeTagModalProps> = ({
  product,
  isOpen,
  onClose,
  initialQuantity
}) => {
  const [copies, setCopies] = useState<number>(initialQuantity || (product?.stock && product.stock > 0 ? product.stock : 1));
  const [copied, setCopied] = useState(false);
  const { settings } = useSettings();

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Screen Modal Dialog (Hidden during printing) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm print:hidden">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-900 text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-neutral-800 rounded-lg text-emerald-400">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">Retail Barcode Hangtag</h3>
                <p className="text-xs text-neutral-400">Machine-readable price tag & barcode sticker</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6">
            {/* Tag Preview Box */}
            <div className="flex flex-col items-center justify-center p-6 bg-neutral-50 rounded-xl border border-neutral-200/80">
              <div className="w-64 bg-white p-5 rounded-lg border-2 border-dashed border-neutral-300 shadow-sm text-center relative">
                <div className="text-[11px] font-bold tracking-widest uppercase text-neutral-500 pb-1 border-b border-neutral-100 mb-2">
                  {settings.brandName}
                </div>
                
                <div className="font-bold text-sm text-neutral-900 leading-tight mb-1 truncate px-1">
                  {product.name}
                </div>

                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className="text-[11px] font-semibold bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded">
                    Size: {product.size}
                  </span>
                  <span className="text-[11px] font-medium text-neutral-600">
                    {product.color}
                  </span>
                </div>

                {/* Machine Readable Barcode Graphic */}
                <div className="py-2 px-1 bg-white border border-neutral-100 rounded">
                  <BarcodeRenderer
                    value={product.barcode}
                    width={1.6}
                    height={46}
                    fontSize={11}
                  />
                </div>

                <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between px-2">
                  <span className="text-xs font-medium text-neutral-500">M.R.P.</span>
                  <span className="text-base font-extrabold text-neutral-900">
                    {formatCurrency(product.sellingPrice, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Print Configuration Controls */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold text-neutral-700 block">Print Quantity / Copies</label>
                  <p className="text-[11px] text-neutral-500">
                    Current stock available: <span className="font-semibold text-neutral-800">{product.stock} units</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCopies(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 h-8 text-center bg-white border border-neutral-300 rounded-lg text-sm font-bold text-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setCopies(prev => prev + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-100 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {product.stock > 1 && (
                <button
                  type="button"
                  onClick={() => setCopies(product.stock)}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 flex items-center gap-1 underline underline-offset-2"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Set copies equal to total stock quantity ({product.stock} labels)
                </button>
              )}

              {/* Barcode number quick copy */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-200 text-xs text-neutral-600">
                <span className="font-mono">Code: {product.barcode}</span>
                <button
                  type="button"
                  onClick={handleCopyBarcode}
                  className="flex items-center gap-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Number'}
                </button>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-200/60 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Barcode {copies > 1 ? `(${copies} Tags)` : 'Tag'}
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED PRINTABLE CONTAINER (Only visible when window.print() is called) */}
      <div id="printable-barcode-tag" className="hidden print:block bg-white p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
          {Array.from({ length: copies }).map((_, index) => (
            <div
              key={index}
              className="border border-neutral-800 p-3 rounded text-center bg-white text-black"
              style={{
                border: '1.5px solid #171717',
                padding: '12px',
                borderRadius: '6px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                color: '#000000',
                pageBreakInside: 'avoid',
                breakInside: 'avoid',
                minWidth: '200px'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '2px' }}>
                {settings.brandName}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.2', marginBottom: '3px' }}>
                {product.name}
              </div>
              <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '6px' }}>
                SIZE: {product.size} &nbsp;|&nbsp; {product.color}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                <BarcodeRenderer
                  value={product.barcode}
                  width={1.5}
                  height={42}
                  fontSize={10}
                />
              </div>

              <div style={{ fontSize: '13px', fontWeight: '800', marginTop: '4px', borderTop: '1px solid #e5e5e5', paddingTop: '4px' }}>
                PRICE: {formatCurrency(product.sellingPrice, settings.currencySymbol)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
