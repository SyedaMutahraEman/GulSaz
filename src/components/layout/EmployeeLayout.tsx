import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Navbar } from './Navbar';

export const EmployeeLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { settings } = useSettings();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F3F4F6] text-xs text-gray-500">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] text-[#111827] font-sans overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <Outlet />
      </main>

      <footer className="h-7 bg-black text-white flex items-center px-6 justify-between text-[10px] uppercase tracking-widest shrink-0 select-none print:hidden">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span>System Status:</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400 font-bold">Online</span>
          </span>
          <span className="text-gray-600">|</span>
          <span>Register: <strong className="text-white">#01 Front Terminal</strong></span>
          <span className="text-gray-600">|</span>
          <span>Mode: <strong className="text-white">Barcode Scanner Active</strong></span>
        </div>
        <span className="text-gray-400">© {new Date().getFullYear()} {settings.brandName} POS</span>
      </footer>
    </div>
  );
};
