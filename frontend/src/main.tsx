import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Fleet } from './pages/Fleet';
import { Drivers } from './pages/Drivers';
import { Trips } from './pages/Trips';
import { Maintenance } from './pages/Maintenance';
import { Fuel } from './pages/Fuel';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { canAccessPage } from './utils/rbac';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Spinner used while auth is loading
const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#070913]">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Only authenticated users may pass through
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Already logged-in users are bounced to dashboard
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <Spinner />;
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

// Page-level RBAC guard: checks canAccessPage and redirects to / if denied
const RoleGuard: React.FC<{ page: string; children: React.ReactNode }> = ({ page, children }) => {
  const { user } = useAuth();
  const role = (user as any)?.role as string | undefined;
  if (!canAccessPage(role, page)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <GuestRoute><Login /></GuestRoute>,
  },
  {
    path: '/register',
    element: <GuestRoute><Register /></GuestRoute>,
  },
  {
    path: '/forgot-password',
    element: <GuestRoute><ForgotPassword /></GuestRoute>,
  },
  {
    path: '/reset-password',
    element: <GuestRoute><ResetPassword /></GuestRoute>,
  },
  {
    path: '/',
    element: <PrivateRoute><DashboardLayout /></PrivateRoute>,
    children: [
      {
        index: true,
        element: (
          <RoleGuard page="dashboard">
            <Dashboard />
          </RoleGuard>
        ),
      },
      {
        path: 'fleet',
        element: (
          <RoleGuard page="fleet">
            <Fleet />
          </RoleGuard>
        ),
      },
      {
        path: 'drivers',
        element: (
          <RoleGuard page="drivers">
            <Drivers />
          </RoleGuard>
        ),
      },
      {
        path: 'trips',
        element: (
          <RoleGuard page="trips">
            <Trips />
          </RoleGuard>
        ),
      },
      {
        path: 'maintenance',
        element: (
          <RoleGuard page="maintenance">
            <Maintenance />
          </RoleGuard>
        ),
      },
      {
        path: 'fuel',
        element: (
          <RoleGuard page="fuel">
            <Fuel />
          </RoleGuard>
        ),
      },
      {
        path: 'expenses',
        element: (
          <RoleGuard page="expenses">
            <Expenses />
          </RoleGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleGuard page="reports">
            <Reports />
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
