import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Shirt,
  Boxes,
  ReceiptText,
  ShoppingBag,
  Tag
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    {
      to: '/admin',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      end: true
    },
    {
      to: '/admin/products',
      label: 'Garment Products',
      icon: Shirt,
      end: false
    },
    {
      to: '/admin/stock',
      label: 'Stock Inventory',
      icon: Boxes,
      end: false
    },
    {
      to: '/admin/sales',
      label: 'Sales & Bills History',
      icon: ReceiptText,
      end: false
    }
  ];

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] select-none print:hidden">
      {/* Navigation Links */}
      <div className="p-4 space-y-1 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-2">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-black text-white shadow-xs'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-2">
            Counter POS
          </div>
          <NavLink
            to="/pos"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200 transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-black shrink-0" />
            <span>Launch Front POS</span>
          </NavLink>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        <div className="p-2.5 rounded-lg border border-gray-200 bg-white text-[11px] text-gray-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-gray-900">
            <Tag className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-[10px] uppercase tracking-wider">Barcode Ready</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-snug">
            Code 128 barcodes compatible with standard retail USB/Bluetooth scanners.
          </p>
        </div>
      </div>
    </aside>
  );
};
