import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/utils';
import { CreditCard, Banknote, Smartphone, Check, X, AlertCircle } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { total, finalizeSale, cart } = useCart();
  const { settings } = useSettings();

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(total);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmountPaid(total);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, total]);

  if (!isOpen) return null;

  const change = Math.max(0, amountPaid - total);
  const isUnderpaid = paymentMethod === 'cash' && amountPaid < total;

  const handleQuickCash = (value: number) => {
    setAmountPaid(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnderpaid) {
      setError(`Amount paid is less than total amount (${formatCurrency(total, settings.currencySymbol)})`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await finalizeSale({
        paymentMethod,
        amountPaid: paymentMethod === 'cash' ? amountPaid : total,
        notes: notes.trim() || undefined
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Failed to complete sale transaction');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete sale transaction');
      setIsSubmitting(false);
    }
  };

  // Quick cash bill suggestions based on total
  const suggestedCashBills = [
    total,
    Math.ceil(total / 500) * 500,
    Math.ceil(total / 1000) * 1000,
    Math.ceil(total / 5000) * 5000
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-sm print:hidden">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-900 text-white">
          <div>
            <h3 className="text-base font-bold">Complete Sale & Payment</h3>
            <p className="text-xs text-neutral-400">Total Items: {cart.reduce((s, i) => s + i.quantity, 0)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="p-6 space-y-5">
          {/* Total Amount Display */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Net Payable Amount</span>
              <span className="text-2xl font-black text-neutral-900">
                {formatCurrency(total, settings.currencySymbol)}
              </span>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
              Ready for Checkout
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-700 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('cash');
                  setAmountPaid(total);
                }}
                className={`p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cash'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-xs font-bold">Cash</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('card');
                  setAmountPaid(total);
                }}
                className={`p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'card'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs font-bold">Credit / POS</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('online');
                  setAmountPaid(total);
                }}
                className={`p-3 rounded-xl border-2 text-center transition-all flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'online'
                    ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-bold">Online / App</span>
              </button>
            </div>
          </div>

          {/* Cash Tendered Calculation */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700">Cash Received / Tendered</label>
                <span className="text-xs text-neutral-500 font-medium">Currency: {settings.currencySymbol}</span>
              </div>
              
              <input
                type="number"
                min={0}
                step="any"
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl font-mono text-lg font-bold text-neutral-900 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
                placeholder="Enter amount given by customer"
                autoFocus
              />

              {/* Quick Cash Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestedCashBills.map((suggested, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickCash(suggested)}
                    className="px-2.5 py-1 text-xs font-mono font-semibold bg-white border border-neutral-300 hover:border-neutral-900 rounded-lg text-neutral-800 transition-colors"
                  >
                    {formatCurrency(suggested, settings.currencySymbol)}
                  </button>
                ))}
              </div>

              {/* Change calculation */}
              <div className="pt-2 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-600">Change Due to Customer:</span>
                <span className={`text-base font-mono font-extrabold ${change > 0 ? 'text-emerald-700' : 'text-neutral-700'}`}>
                  {formatCurrency(change, settings.currencySymbol)}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 rounded-xl transition-colors"
            >
              Back to Cart
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (paymentMethod === 'cash' && amountPaid < total)}
              id="confirm-complete-sale-btn"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Processing Sale...' : 'Confirm & Complete Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
