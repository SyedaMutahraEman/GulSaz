import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AdminLayout: React.FC = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
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

  if (role !== 'admin') {
    return <Navigate to="/pos" replace />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#F3F4F6] text-[#111827] font-sans overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-w-full">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>

      <footer className="h-7 bg-black text-white flex items-center px-6 justify-between text-[10px] uppercase tracking-widest shrink-0 select-none print:hidden">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span>System Status:</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400 font-bold">Online</span>
          </span>
          <span className="text-gray-600">|</span>
          <span>Access Level: <strong className="text-white">Admin / Store Manager</strong></span>
        </div>
        <span className="text-gray-400">© {new Date().getFullYear()} {settings.brandName}</span>
      </footer>
    </div>
  );
};
