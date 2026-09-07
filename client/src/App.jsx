import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { LanguageGate } from './components/LanguageGate';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SocketProvider } from './context/SocketContext';

// Public & Auth Pages
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { CustomerRegister } from './pages/auth/CustomerRegister';
import { WorkerOnboarding } from './pages/auth/WorkerOnboarding';

// Customer Pages & Layout
import { CustomerLayout } from './layouts/CustomerLayout';
import { CustomerHome } from './pages/customer/CustomerHome';
import { CustomerProfile } from './pages/customer/CustomerProfile';
import { BookServiceWorkflow } from './pages/customer/BookServiceWorkflow';
import { BookingHistory } from './pages/customer/BookingHistory';

// Worker Pages & Layout
import { WorkerLayout } from './layouts/WorkerLayout';
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerProfile } from './pages/worker/WorkerProfile';
import { WorkerKycOnboarding } from './pages/worker/WorkerKycOnboarding';
import { WorkerAvailability } from './pages/worker/WorkerAvailability';
import { WorkerEarnings } from './pages/worker/WorkerEarnings';

// Cooperative Pages & Layout
import { CooperativeLayout } from './layouts/CooperativeLayout';
import { CooperativeDashboard } from './pages/cooperative/CooperativeDashboard';
import { WorkerManagement } from './pages/cooperative/WorkerManagement';
import { BookingsManager } from './pages/cooperative/BookingsManager';
import { RateCardManager } from './pages/cooperative/RateCardManager';
import { FinanceLedger } from './pages/cooperative/FinanceLedger';
import { WelfareManager } from './pages/cooperative/WelfareManager';
import { DisputesPanel } from './pages/cooperative/DisputesPanel';
import { DemandForecast } from './pages/cooperative/DemandForecast';
import { CooperativeReports } from './pages/cooperative/CooperativeReports';
import { CooperativeSettings } from './pages/cooperative/CooperativeSettings';
import { CooperativeProfile } from './pages/cooperative/CooperativeProfile';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <LanguageGate />
          <BrowserRouter>
            <Routes>
              {/* Public Landing & Authentication */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register/customer" element={<CustomerRegister />} />
              <Route path="/register/worker" element={<WorkerOnboarding />} />

              {/* CUSTOMER PORTAL - Strictly guarded for 'customer' role */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CustomerHome />} />
                <Route path="home" element={<CustomerHome />} />
                <Route path="book" element={<BookServiceWorkflow />} />
                <Route path="history" element={<BookingHistory />} />
                <Route path="profile" element={<CustomerProfile />} />
              </Route>

              {/* WORKER PORTAL - Strictly guarded for 'worker' role (Mobile-First) */}
              <Route
                path="/worker"
                element={
                  <ProtectedRoute allowedRoles={['worker']}>
                    <WorkerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<WorkerDashboard />} />
                <Route path="dashboard" element={<WorkerDashboard />} />
                <Route path="kyc" element={<WorkerKycOnboarding />} />
                <Route path="availability" element={<WorkerAvailability />} />
                <Route path="earnings" element={<WorkerEarnings />} />
                <Route path="profile" element={<WorkerProfile />} />
              </Route>

              {/* COOPERATIVE ADMIN PORTAL - Strictly guarded for 'cooperative_admin' role */}
              <Route
                path="/cooperative"
                element={
                  <ProtectedRoute allowedRoles={['cooperative_admin']}>
                    <CooperativeLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<CooperativeDashboard />} />
                <Route path="dashboard" element={<CooperativeDashboard />} />
                <Route path="workers" element={<WorkerManagement />} />
                <Route path="bookings" element={<BookingsManager />} />
                <Route path="rate-card" element={<RateCardManager />} />
                <Route path="finance" element={<FinanceLedger />} />
                <Route path="welfare" element={<WelfareManager />} />
                <Route path="disputes" element={<DisputesPanel />} />
                <Route path="forecast" element={<DemandForecast />} />
                <Route path="reports" element={<CooperativeReports />} />
                <Route path="settings" element={<CooperativeSettings />} />
                <Route path="profile" element={<CooperativeProfile />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
