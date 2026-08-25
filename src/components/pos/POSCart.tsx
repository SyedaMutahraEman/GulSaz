import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import { formatCurrency } from '../../lib/utils';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface POSCartProps {
  onOpenCheckout: () => void;
  onOpenLookup?: () => void;
}

export const POSCart: React.FC<POSCartProps> = ({ onOpenCheckout, onOpenLookup }) => {
  const {
    cart,
    subtotal,
    discount,
    discountPercent,
    setDiscountPercentage,
    total,
    totalQuantity,
    updateItemQuantity,
    removeItemFromCart,
    clearCart
  } = useCart();

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [customDiscount, setCustomDiscount] = useState('');
  const { settings } = useSettings();

  const handleApplyDiscount = (percent: number) => {
    if (discountPercent === percent) {
      setDiscountPercentage(0);
    } else {
      setDiscountPercentage(percent);
    }
  };

  const handleCustomDiscountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customDiscount) || 0;
    setDiscountPercentage(val);
    setShowDiscountInput(false);
    setCustomDiscount('');
  };

  // Estimate tax for High Density layout display
  const taxRate = (settings.taxRatePercent || 5) / 100;
  const taxAmount = (subtotal - discount) * taxRate;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    void updateItemQuantity(productId, newQuantity);
  };

  if (cart.length === 0) {
    return (
      <div className="h-full bg-white border-l border-gray-200 flex flex-col shadow-xs select-none">
        <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
          <h2 className="font-bold text-sm uppercase tracking-wider text-gray-900">Current Sale</h2>
          <span className="text-xs font-mono font-bold px-2 py-0.5 bg-black text-white rounded">
            #NEW-BILL
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mb-3">
            <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-bold text-gray-800 mb-1">Cart is Empty</h3>
          <p className="text-xs text-gray-400 max-w-[220px] mb-4">
            Scan a clothing barcode or select items from available stock.
          </p>
          <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded border border-gray-200">
            Scanner Ready &bull; Live
          </span>
        </div>

        <div className="p-5 bg-white border-t border-gray-200 text-xs text-gray-400 text-center">
          Terminal Register Ready
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white border-l border-gray-200 flex flex-col shadow-xl">
      {/* Drawer Header */}
      <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-bold text-sm uppercase tracking-wider text-gray-900">Current Sale</h2>
          <span className="text-[10px] text-gray-400 font-semibold">
            {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} in bill
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all items from the current cart?')) {
                clearCart();
              }
            }}
            className="text-[11px] text-gray-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-gray-100 font-semibold"
          >
            Clear
          </button>
          <span className="text-xs font-mono font-bold px-2 py-1 bg-black text-white rounded">
            #NEW-SALE
          </span>
        </div>
      </div>

      {/* Cart Items List (Compact High Density) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {cart.map((item) => {
          const isAtMaxStock = item.quantity >= item.maxStock;

          return (
            <div
              key={item.productId}
              className="flex gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:border-gray-200 transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate leading-snug">
                  {item.productName}
                </p>
                <p className="text-[10px] text-gray-500 uppercase font-semibold mt-0.5 truncate">
                  {item.color} &bull; {item.size} &bull; <span className="font-mono">{item.barcode}</span>
                </p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                    className="w-6 h-6 border border-gray-300 bg-white hover:bg-gray-100 rounded flex items-center justify-center font-bold text-xs text-gray-700 transition-colors"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-gray-900 min-w-[16px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                    disabled={isAtMaxStock}
                    className={`w-6 h-6 border border-gray-300 bg-white rounded flex items-center justify-center font-bold text-xs text-gray-700 transition-colors ${
                      isAtMaxStock ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-100'
                    }`}
                    title={isAtMaxStock ? `Max stock available is ${item.maxStock}` : 'Increase'}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-right flex flex-col justify-between shrink-0">
                <p className="text-xs font-mono font-bold text-gray-900">
                  {formatCurrency(item.total, settings.currencySymbol)}
                </p>
                <button
                  type="button"
                  onClick={() => removeItemFromCart(item.productId)}
                  className="text-red-500 hover:text-red-700 text-[11px] underline font-medium transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bill Calculation & Checkout Footer */}
      <div className="p-5 bg-white border-t border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] space-y-3.5 shrink-0">
        {/* Discount Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-gray-500 uppercase tracking-wider">Discount:</span>
            {discount > 0 && (
              <button
                type="button"
                onClick={() => setDiscountPercentage(0)}
                className="text-red-500 hover:underline font-semibold"
              >
                Remove ({discountPercent > 0 ? `${discountPercent}%` : formatCurrency(discount, settings.currencySymbol)})
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {[5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleApplyDiscount(pct)}
                className={`flex-1 py-1 text-[11px] font-bold rounded border transition-all ${
                  discountPercent === pct
                    ? 'bg-black border-black text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                {pct}%
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowDiscountInput(!showDiscountInput)}
              className={`px-2 py-1 text-[11px] font-semibold rounded border transition-all ${
                showDiscountInput || (discountPercent > 0 && ![5, 10, 15, 20].includes(discountPercent))
                  ? 'bg-black border-black text-white'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400'
              }`}
            >
              Custom
            </button>
          </div>

          {showDiscountInput && (
            <form onSubmit={handleCustomDiscountSubmit} className="flex gap-2 pt-1">
              <input
                type="number"
                min={0}
                max={100}
                value={customDiscount}
                onChange={(e) => setCustomDiscount(e.target.value)}
                placeholder="Discount %"
                className="flex-1 px-2.5 py-1 text-xs bg-gray-50 border border-gray-200 rounded"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-black text-white text-xs font-bold rounded"
              >
                Apply
              </button>
            </form>
          )}
        </div>

        {/* Calculation Lines */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-mono font-medium">{formatCurrency(subtotal, settings.currencySymbol)}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Discount ({discountPercent > 0 ? `${discountPercent}%` : 'Manual'})</span>
              <span className="font-mono">-{formatCurrency(discount, settings.currencySymbol)}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-black border-t border-gray-200 pt-2.5 mt-2 text-gray-900">
            <span className="uppercase tracking-wider">TOTAL</span>
            <span className="font-mono text-black">{formatCurrency(total, settings.currencySymbol)}</span>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenCheckout}
            id="pos-complete-sale-trigger-btn"
            className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md hover:bg-gray-800 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>COMPLETE SALE &bull; {formatCurrency(total, settings.currencySymbol)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
