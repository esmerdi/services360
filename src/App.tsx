import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { I18nProvider } from './context/I18nContext';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth pages
import Login       from './pages/auth/Login';
import Register    from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import Landing     from './pages/Landing';

// Admin pages
import AdminDashboard  from './pages/admin/Dashboard';
import AdminUsers      from './pages/admin/Users';
import AdminCategories from './pages/admin/Categories';
import AdminServices   from './pages/admin/Services';
import AdminRequests   from './pages/admin/Requests';
import AdminPlans      from './pages/admin/Plans';

// Client pages
import ClientDashboard     from './pages/client/Dashboard';
import ClientBrowse        from './pages/client/Browse';
import ClientRequestService from './pages/client/RequestService';
import ClientMyRequests    from './pages/client/MyRequests';
import ClientRequestDetail from './pages/client/RequestDetail';
import ClientProfile       from './pages/client/Profile';

// Provider pages
import ProviderDashboard      from './pages/provider/Dashboard';
import ProviderNearbyRequests from './pages/provider/NearbyRequests';
import ProviderMyJobs         from './pages/provider/MyJobs';
import ProviderProfile        from './pages/provider/Profile';
import ProviderSubscription   from './pages/provider/Subscription';

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

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <LocationProvider>
          <BrowserRouter>
            <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

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
                  <AdminDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/admin/users"
              element={
                <RequireRole role="admin">
                  <AdminUsers />
                </RequireRole>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <RequireRole role="admin">
                  <AdminCategories />
                </RequireRole>
              }
            />
            <Route
              path="/admin/services"
              element={
                <RequireRole role="admin">
                  <AdminServices />
                </RequireRole>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <RequireRole role="admin">
                  <AdminRequests />
                </RequireRole>
              }
            />
            <Route
              path="/admin/plans"
              element={
                <RequireRole role="admin">
                  <AdminPlans />
                </RequireRole>
              }
            />

            {/* Client */}
            <Route
              path="/client"
              element={
                <RequireRole role="client">
                  <ClientDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/client/browse"
              element={
                <RequireRole role="client">
                  <ClientBrowse />
                </RequireRole>
              }
            />
            <Route
              path="/client/request/:serviceId"
              element={
                <RequireRole role="client">
                  <ClientRequestService />
                </RequireRole>
              }
            />
            <Route
              path="/client/requests"
              element={
                <RequireRole role="client">
                  <ClientMyRequests />
                </RequireRole>
              }
            />
            <Route
              path="/client/requests/:id"
              element={
                <RequireRole role="client">
                  <ClientRequestDetail />
                            <Route
                              path="/client/profile"
                              element={
                                <RequireRole role="client">
                                  <ClientProfile />
                                </RequireRole>
                              }
                            />
                </RequireRole>
              }
            />

            {/* Provider */}
            <Route
              path="/provider"
              element={
                <RequireRole role="provider">
                  <ProviderDashboard />
                </RequireRole>
              }
            />
            <Route
              path="/provider/nearby"
              element={
                <RequireRole role="provider">
                  <ProviderNearbyRequests />
                </RequireRole>
              }
            />
            <Route
              path="/provider/jobs"
              element={
                <RequireRole role="provider">
                  <ProviderMyJobs />
                </RequireRole>
              }
            />
            <Route
              path="/provider/profile"
              element={
                <RequireRole role="provider">
                  <ProviderProfile />
                </RequireRole>
              }
            />
            <Route
              path="/provider/subscription"
              element={
                <RequireRole role="provider">
                  <ProviderSubscription />
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
