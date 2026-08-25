import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginPage } from '../pages/auth/LoginPage';
import { AdminLayout } from '../components/layout/AdminLayout';
import { EmployeeLayout } from '../components/layout/EmployeeLayout';
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { ProductsPage } from '../pages/admin/ProductsPage';
import { StockPage } from '../pages/admin/StockPage';
import { SalesHistoryPage } from '../pages/admin/SalesHistoryPage';
import { EmployeePOSPage } from '../pages/employee/EmployeePOSPage';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Protected Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="sales" element={<SalesHistoryPage />} />
      </Route>

      {/* Employee / Cashier POS Protected Routes */}
      <Route path="/pos" element={<EmployeeLayout />}>
        <Route index element={<EmployeePOSPage />} />
      </Route>

      {/* Root & Catch-all Redirects */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/pos" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={
          isAuthenticated ? (
            role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/pos" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};
