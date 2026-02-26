import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { HomePage } from './HomePage';
import { ProfilePage } from './ProfilePage';
import { RequestsPage } from './RequestsPage';
import { RequestBloodPage } from './RequestBloodPage';
import { DonorsPage } from './DonorsPage';
import { DonationsPage } from './DonationsPage';
import { UpdateAvailabilityPage } from './UpdateAvailabilityPage';
import { AdminDashboardPage } from './AdminDashboardPage';
import { Header } from '../components/shared/Header';
import { BottomNav } from '../components/shared/BottomNav';

export const Router: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 bg-red-100 rounded-full mb-4 animate-pulse"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      {!isAuthenticated ? (
        <>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        /* Protected Routes */
        <>
          <Route
            path="/*"
            element={
              <>
                <Header />
                <main className="pb-20">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/requests" element={<RequestsPage />} />
                    <Route path="/request" element={<RequestBloodPage />} />
                    <Route path="/donors" element={<DonorsPage />} />
                    <Route path="/donations" element={<DonationsPage />} />
                    <Route path="/update-availability" element={<UpdateAvailabilityPage />} />
                    
                    {/* Admin-only routes */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requiredRoles={['admin']}>
                          <AdminDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <BottomNav />
              </>
            }
          />

        </>
      )}
    </Routes>
  );
};

