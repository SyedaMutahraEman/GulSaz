import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { formatTime, formatDate } from '../../lib/utils';
import {
  Clock,
  LogOut,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { currentUser, role, logout } = useAuth();
  const { settings } = useSettings();
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Monogram initials
  const initials = settings.brandName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GS';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-40 select-none print:hidden shadow-xs">
      {/* Left: Brand Monogram & Title */}
      <div className="flex items-center gap-4">
        <Link to={role === 'admin' ? '/admin' : '/pos'} className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-black text-white flex items-center justify-center font-black text-sm tracking-wider rounded-lg group-hover:scale-105 transition-transform">
            {initials}
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight uppercase text-gray-900 flex items-center gap-1.5">
              <span>{settings.brandName}</span>
              <span className="text-gray-400 font-normal">| POS</span>
            </h1>
            <span className="text-[10px] text-gray-400 font-medium block leading-none tracking-wider uppercase">
              {settings.tagline}
            </span>
          </div>
        </Link>
      </div>

      {/* Center: Realtime Clock */}
      <div className="hidden lg:flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600">
        <Clock className="w-3.5 h-3.5 text-gray-400" />
        <span className="font-mono font-bold text-gray-900">{formatTime(time.toISOString())}</span>
        <span className="text-gray-300">&bull;</span>
        <span className="font-medium text-gray-600">{formatDate(time.toISOString())}</span>
      </div>

      {/* Right: Role Navigation & User Info & Logout */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Quick Switch Button */}
        {role === 'admin' && (
          <>
            <Link
              to="/pos"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-black text-white hover:bg-gray-800 rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Open Cashier POS</span>
            </Link>
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-gray-600" />
              <span>Admin Portal</span>
            </Link>
          </>
        )}

        {/* User Badge */}
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider leading-tight">
            Logged in as
          </p>
          <p className="text-xs font-bold text-gray-900 flex items-center justify-end gap-1.5">
            <span>{currentUser?.name || 'Staff User'}</span>
            <span className="text-[10px] text-gray-400 font-normal">
              ({role === 'admin' ? 'Admin' : 'Employee'})
            </span>
          </p>
        </div>

        {/* High Density Soft Red Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-red-100 flex items-center gap-1.5 transition-colors"
          title="Logout of Terminal"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};
