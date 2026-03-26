import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { I18nProvider } from './context/I18nContext';
import LoadingSpinner from './components/common/LoadingSpinner';

const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const VerifyEmail = React.lazy(() => import('./pages/auth/VerifyEmail'));
const Landing = React.lazy(() => import('./pages/Landing'));

const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/Users'));
const AdminCategories = React.lazy(() => import('./pages/admin/Categories'));
const AdminServices = React.lazy(() => import('./pages/admin/Services'));
const AdminRequests = React.lazy(() => import('./pages/admin/Requests'));
const AdminPlans = React.lazy(() => import('./pages/admin/Plans'));

const ClientDashboard = React.lazy(() => import('./pages/client/Dashboard'));
const ClientBrowse = React.lazy(() => import('./pages/client/Browse'));
const ClientRequestService = React.lazy(() => import('./pages/client/RequestService'));
const ClientMyRequests = React.lazy(() => import('./pages/client/MyRequests'));
const ClientRequestDetail = React.lazy(() => import('./pages/client/RequestDetail'));
const ClientProfile = React.lazy(() => import('./pages/client/Profile'));

const ProviderDashboard = React.lazy(() => import('./pages/provider/Dashboard'));
const ProviderNearbyRequests = React.lazy(() => import('./pages/provider/NearbyRequests'));
const ProviderMyJobs = React.lazy(() => import('./pages/provider/MyJobs'));
const ProviderProfile = React.lazy(() => import('./pages/provider/Profile'));
const ProviderSubscription = React.lazy(() => import('./pages/provider/Subscription'));

// ─── Route Guards ─────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({
  role,
  children,
}: {
  role: 'admin' | 'client' | 'provider';
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <>{children}</>;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function RoutePage({ children }: { children: React.ReactNode }) {
  return <React.Suspense fallback={<FullPageLoader />}>{children}</React.Suspense>;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <LocationProvider>
          <BrowserRouter>
            <Routes>
            {/* Public */}
            <Route path="/" element={<RoutePage><Landing /></RoutePage>} />
            <Route path="/login" element={<RoutePage><Login /></RoutePage>} />
            <Route path="/register" element={<RoutePage><Register /></RoutePage>} />
            <Route path="/verify-email" element={<RoutePage><VerifyEmail /></RoutePage>} />

            {/* Role redirect */}
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <RoleRedirect />
                </RequireAuth>
              }
            />

            {/* Admin */}
            <Route
              path="/admin"
              element={
                <RequireRole role="admin">
                  <RoutePage><AdminDashboard /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireRole role="admin">
                  <RoutePage><AdminUsers /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <RequireRole role="admin">
                  <RoutePage><AdminCategories /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/admin/services"
              element={
                <RequireRole role="admin">
                  <RoutePage><AdminServices /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <RequireRole role="admin">
                  <RoutePage><AdminRequests /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/admin/plans"
              element={
                <RequireRole role="admin">
                  <RoutePage><AdminPlans /></RoutePage>
                </RequireRole>
              }
            />

            {/* Client */}
            <Route
              path="/client"
              element={
                <RequireRole role="client">
                  <RoutePage><ClientDashboard /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/client/browse"
              element={
                <RequireRole role="client">
                  <RoutePage><ClientBrowse /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/client/request/:serviceId"
              element={
                <RequireRole role="client">
                  <RoutePage><ClientRequestService /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/client/requests"
              element={
                <RequireRole role="client">
                  <RoutePage><ClientMyRequests /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/client/requests/:id"
              element={
                <RequireRole role="client">
                  <RoutePage><ClientRequestDetail /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/client/profile"
              element={
                <RequireRole role="client">
                  <RoutePage><ClientProfile /></RoutePage>
                </RequireRole>
              }
            />

            {/* Provider */}
            <Route
              path="/provider"
              element={
                <RequireRole role="provider">
                  <RoutePage><ProviderDashboard /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/provider/nearby"
              element={
                <RequireRole role="provider">
                  <RoutePage><ProviderNearbyRequests /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/provider/jobs"
              element={
                <RequireRole role="provider">
                  <RoutePage><ProviderMyJobs /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/provider/profile"
              element={
                <RequireRole role="provider">
                  <RoutePage><ProviderProfile /></RoutePage>
                </RequireRole>
              }
            />
            <Route
              path="/provider/subscription"
              element={
                <RequireRole role="provider">
                  <RoutePage><ProviderSubscription /></RoutePage>
                </RequireRole>
              }
            />

            {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
