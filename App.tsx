
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { LandingPage } from './pages/LandingPage';
import { BookingWizard } from './pages/client/BookingWizard';
import { MyAppointments } from './pages/client/MyAppointments';
import { ClientSubscription } from './pages/client/ClientSubscription';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ManageServices } from './pages/admin/ManageServices';
import { ManageProfessionals } from './pages/admin/ManageProfessionals';
import { ManageClients } from './pages/admin/ManageClients';
import { ManageBranches } from './pages/admin/ManageBranches';
import { AppointmentsList } from './pages/admin/AppointmentsList';
import { ManageProducts } from './pages/admin/ManageProducts';
import { SiteSettings } from './pages/admin/SiteSettings';
import { FinancialDashboard } from './pages/admin/FinancialDashboard';
import { ManageSubscriptions } from './pages/admin/ManageSubscriptions';
import { SystemLogs } from './pages/admin/SystemLogs';
import { WaitingList } from './pages/admin/WaitingList';
import { WalkInQueue } from './pages/admin/WalkInQueue';
import { ManageProfiles } from './pages/admin/ManageProfiles';
import { Reports } from './pages/admin/Reports';
import { Reviews } from './pages/admin/Reviews';
import { ProfessionalDashboard } from './pages/professional/ProfessionalDashboard';
import { ProfessionalAppointments } from './pages/professional/ProfessionalAppointments';
import { WhatsAppChat } from './pages/admin/WhatsAppChat';
import { ProfileSettings } from './pages/ProfileSettings';
import { UserRole } from './types';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: UserRole[] }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
  }

  return <>{children}</>;
};

// Layout Wrapper for Routes that need Sidebar
const AppLayout = ({ children }: { children?: React.ReactNode }) => {
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  const getRedirectPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case UserRole.CLIENT: return '/book';
      case UserRole.PROFESSIONAL: return '/professional';
      case UserRole.ADMIN: return '/admin';
      default: return '/';
    }
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        <Route 
          path="/login" 
          element={
            user 
              ? <Navigate to={getRedirectPath()} replace /> 
              : <Login />
          } 
        />

        {/* Unified Profile Route */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProfileSettings />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Client Routes */}
        <Route 
          path="/book" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
              <AppLayout>
                <BookingWizard />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/my-appointments" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
              <AppLayout>
                <MyAppointments />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/subscription" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
              <AppLayout>
                <ClientSubscription />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Professional Routes */}
        <Route 
          path="/professional" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.PROFESSIONAL]}>
              <AppLayout>
                <ProfessionalDashboard />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/professional/appointments" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.PROFESSIONAL]}>
              <AppLayout>
                <ProfessionalAppointments />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin/services" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <ManageServices />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <ManageProducts />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/professionals" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <ManageProfessionals />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/branches" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <ManageBranches />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/subscriptions" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <ManageSubscriptions />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/clients" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <ManageClients />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/admin/appointments" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PROFESSIONAL]}>
              <AppLayout>
                <AppointmentsList />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/waiting-list" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PROFESSIONAL]}>
              <AppLayout>
                <WaitingList />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/queue" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PROFESSIONAL]}>
              <AppLayout>
                <WalkInQueue />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/conversations" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PROFESSIONAL]}>
              <AppLayout>
                <WhatsAppChat />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/financial" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <FinancialDashboard />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <Reports />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reviews" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PROFESSIONAL]}>
              <AppLayout>
                <Reviews />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <SiteSettings />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/profiles" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <ManageProfiles />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/logs" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
              <AppLayout>
                <SystemLogs />
              </AppLayout>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Dashboard (Shared View) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.PROFESSIONAL]}>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          } 
        />

        {/* Catch all - Redirect to Landing Page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppRoutes />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
