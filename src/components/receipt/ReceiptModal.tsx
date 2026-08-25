import React, { useEffect } from 'react';
import { Sale } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency, formatDate, formatTime } from '../../lib/utils';
import { BarcodeRenderer } from '../barcode/BarcodeRenderer';
import { Printer, CheckCircle2, X, PlusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onNewSale?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  isOpen,
  onClose,
  onNewSale
}) => {
  const { settings } = useSettings();

  useEffect(() => {
    if (isOpen && sale) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10B981', '#6366F1', '#F59E0B']
        });
      } catch {
        // Confetti fallback
      }
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleStartNewSale = () => {
    onClose();
    if (onNewSale) {
      onNewSale();
    }
  };

  return (
    <>
      {/* SCREEN MODAL DIALOG (Hidden during printing) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm print:hidden">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Success Banner */}
          <div className="bg-emerald-600 text-white px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span className="font-bold text-sm">Sale Completed Successfully</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Receipt View Body */}
          <div className="p-6 overflow-y-auto flex-1 bg-neutral-100/60">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-200 text-neutral-900 font-sans text-xs">
              {/* Header */}
              <div className="text-center pb-4 border-b border-dashed border-neutral-300">
                <h2 className="text-lg font-extrabold tracking-widest text-neutral-900 uppercase">
                  {settings.brandName}
                </h2>
                <p className="text-[11px] text-neutral-500 font-medium">{settings.tagline}</p>
                <p className="text-[10px] text-neutral-400 mt-1">{settings.address}</p>
                <p className="text-[10px] text-neutral-400">Tel: {settings.phone}</p>
              </div>

              {/* Invoice Meta */}
              <div className="py-3 border-b border-dashed border-neutral-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Invoice No:</span>
                  <span className="font-mono font-bold text-neutral-900">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Date & Time:</span>
                  <span>{formatDate(sale.createdAt)} &bull; {formatTime(sale.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Cashier / Staff:</span>
                  <span className="font-medium text-neutral-800">{sale.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 font-medium">Payment Mode:</span>
                  <span className="font-bold uppercase text-neutral-900">{sale.paymentMethod}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="py-3 border-b border-dashed border-neutral-300">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
                      <th className="pb-1.5 font-semibold">Item & Specs</th>
                      <th className="pb-1.5 text-center font-semibold">Qty</th>
                      <th className="pb-1.5 text-right font-semibold">Price</th>
                      <th className="pb-1.5 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="text-[11px]">
                        <td className="py-2 pr-1">
                          <div className="font-bold text-neutral-900 leading-tight">{item.productName}</div>
                          <div className="text-[10px] text-neutral-500">
                            Size: {item.size} &bull; {item.color}
                          </div>
                        </td>
                        <td className="py-2 text-center font-semibold text-neutral-700">{item.quantity}</td>
                        <td className="py-2 text-right font-mono text-neutral-600">
                          {formatCurrency(item.unitPrice, settings.currencySymbol)}
                        </td>
                        <td className="py-2 text-right font-mono font-bold text-neutral-900">
                          {formatCurrency(item.total, settings.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bill Totals */}
              <div className="py-3 border-b border-dashed border-neutral-300 space-y-1.5 text-[11px]">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal ({sale.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-mono">{formatCurrency(sale.subtotal, settings.currencySymbol)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount {sale.discountPercent ? `(${sale.discountPercent}%)` : ''}</span>
                    <span className="font-mono">-{formatCurrency(sale.discount, settings.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-neutral-200 text-sm font-extrabold text-neutral-900">
                  <span>GRAND TOTAL</span>
                  <span className="text-base font-black">
                    {formatCurrency(sale.total, settings.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Payment Tender details */}
              <div className="py-2.5 border-b border-dashed border-neutral-300 space-y-1 text-[11px] text-neutral-600">
                <div className="flex justify-between">
                  <span>Amount Paid</span>
                  <span className="font-mono font-bold text-neutral-900">{formatCurrency(sale.amountPaid, settings.currencySymbol)}</span>
                </div>
                {sale.change > 0 && (
                  <div className="flex justify-between text-neutral-800 font-medium">
                    <span>Change Returned</span>
                    <span className="font-mono font-bold text-emerald-700">{formatCurrency(sale.change, settings.currencySymbol)}</span>
                  </div>
                )}
              </div>

              {/* Invoice Barcode */}
              <div className="pt-4 pb-2 text-center flex flex-col items-center">
                <BarcodeRenderer
                  value={sale.invoiceNumber}
                  width={1.4}
                  height={36}
                  fontSize={10}
                  lineColor="#262626"
                />
              </div>

              {/* Footer Policy */}
              <div className="text-center pt-2 text-[10px] text-neutral-500 leading-tight">
                <p className="font-semibold text-neutral-700 mb-0.5">Thank You For Your Purchase!</p>
                <p>{settings.receiptFooterMessage}</p>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="p-4 bg-white border-t border-neutral-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleStartNewSale}
              className="flex-1 py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-neutral-600" />
              New Sale
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow flex items-center justify-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED PRINTABLE RECEIPT (Only visible when window.print() is called) */}
      <div id="printable-receipt" className="hidden print:block bg-white p-4 max-w-xs mx-auto text-black font-sans">
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
            {settings.brandName}
          </h2>
          <p style={{ fontSize: '11px', margin: '2px 0', fontWeight: '500' }}>{settings.tagline}</p>
          <p style={{ fontSize: '10px', margin: '1px 0' }}>{settings.address}</p>
          <p style={{ fontSize: '10px', margin: '1px 0' }}>Tel: {settings.phone}</p>
        </div>

        <div style={{ padding: '8px 0', borderBottom: '1px dashed #000', fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Invoice: <strong>{sale.invoiceNumber}</strong></span>
            <span>{sale.paymentMethod.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            <span>Date: {formatDate(sale.createdAt)}</span>
            <span>{formatTime(sale.createdAt)}</span>
          </div>
          <div style={{ marginTop: '2px' }}>
            <span>Cashier: {sale.employeeName}</span>
          </div>
        </div>

        <div style={{ padding: '8px 0', borderBottom: '1px dashed #000' }}>
          <table style={{ width: '100%', fontSize: '11px', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000', fontSize: '10px' }}>
                <th style={{ paddingBottom: '4px' }}>ITEM</th>
                <th style={{ textAlign: 'center', paddingBottom: '4px' }}>QTY</th>
                <th style={{ textAlign: 'right', paddingBottom: '4px' }}>PRICE</th>
                <th style={{ textAlign: 'right', paddingBottom: '4px' }}>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '4px 0' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                    <div style={{ fontSize: '9px' }}>{item.size} / {item.color}</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '4px 0' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '4px 0' }}>{formatCurrency(item.unitPrice, settings.currencySymbol)}</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 'bold' }}>{formatCurrency(item.total, settings.currencySymbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '8px 0', borderBottom: '1px dashed #000', fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>{formatCurrency(sale.subtotal, settings.currencySymbol)}</span>
          </div>
          {sale.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Discount</span>
              <span>-{formatCurrency(sale.discount, settings.currencySymbol)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '6px', borderTop: '1px solid #000', paddingTop: '4px' }}>
            <span>TOTAL</span>
            <span>{formatCurrency(sale.total, settings.currencySymbol)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
            <span>Paid</span>
            <span>{formatCurrency(sale.amountPaid, settings.currencySymbol)}</span>
          </div>
          {sale.change > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span>Change</span>
              <span>{formatCurrency(sale.change, settings.currencySymbol)}</span>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <BarcodeRenderer
            value={sale.invoiceNumber}
            width={1.3}
            height={32}
            fontSize={9}
            lineColor="#000000"
          />
          <p style={{ fontSize: '11px', fontWeight: 'bold', margin: '4px 0 2px 0' }}>THANK YOU!</p>
          <p style={{ fontSize: '9px', margin: 0 }}>{settings.receiptFooterMessage}</p>
        </div>
      </div>
    </>
  );
};
