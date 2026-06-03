import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/useAuth";
import RegisterPage from "./pages/Register";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import AdminDashboardPage from "./pages/AdminDashboard";
import HospitalDashboardPage from "./pages/HospitalDashboard";
import VerificationsPage from "./pages/AdminDashboard/VerificationsPage";
import RequesterDashboardPage from "./pages/RequesterDashboard";
import DonorsNearMePage from "./pages/RequesterDashboard/DonorsNearMePage";
import RequestsPage from "./pages/Requests";
import CreateRequestPage from "./pages/CreateRequest";
import DonorsPage from "./pages/Donors";
import ErrorBoundary from "./components/ErrorBoundary";
import ProfilePage from "./pages/Profile";
import DashboardLayout from "./components/layout/DashboardLayout";
import InstallPrompt from "./components/layout/InstallPrompt";

function getHomePath(role: string) {
  switch (role) {
    case "admin":
      return "/admin";
    case "requester":
      return "/requester";
    case "hospital":
      return "/hospital";
    default:
      return "/dashboard";
  }
}

function App() {
  const { user, loading, logout, refetch } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">
          progress_activity
        </span>
      </div>
    );
  }

  const homePath = user ? getHomePath(user.role) : "/login";

  return (
    <BrowserRouter>
      <InstallPrompt />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "Inter, sans-serif",
            borderRadius: "12px",
          },
          success: {
            style: {
              background: "#f9f9fb",
              color: "#1a1c1d",
            },
          },
          error: {
            style: {
              background: "#ffdad6",
              color: "#93000a",
            },
          },
        }}
      />
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={user ? <Navigate to={homePath} replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to={homePath} replace /> : <RegisterPage />
          }
        />

        {/* Protected routes */}
        {user ? (
          <Route element={<DashboardLayout onLogout={logout} user={user} />}>
            {/* Role-specific dashboards */}
            <Route
              path="/dashboard"
              element={<DashboardPage user={user} refetch={refetch} />}
            />
            <Route
              path="/admin"
              element={
                user.role === "admin" ? (
                  <AdminDashboardPage user={user} />
                ) : (
                  <Navigate to={homePath} replace />
                )
              }
            />
            <Route
              path="/admin/verifications"
              element={
                user.role === "admin" ? (
                  <VerificationsPage />
                ) : (
                  <Navigate to={homePath} replace />
                )
              }
            />
            <Route
              path="/requester"
              element={
                user.role === "requester" ? (
                  <RequesterDashboardPage user={user} />
                ) : (
                  <Navigate to={homePath} replace />
                )
              }
            />
            <Route
              path="/hospital"
              element={
                user.role === "hospital" ? (
                  <HospitalDashboardPage user={user} />
                ) : (
                  <Navigate to={homePath} replace />
                )
              }
            />

            {/* Requester-only routes */}
            <Route
              path="/requester/donors-near-me"
              element={
                user.role === "requester" || user.role === "hospital" ? (
                  <DonorsNearMePage user={user} />
                ) : (
                  <Navigate to={homePath} replace />
                )
              }
            />

            {/* Shared routes */}
            <Route
              path="/requests"
              element={
                <ErrorBoundary>
                  <RequestsPage user={user} />
                </ErrorBoundary>
              }
            />
            <Route
              path="/create-request"
              element={<CreateRequestPage />}
            />
            <Route path="/donors" element={<DonorsPage />} />
            <Route
              path="/profile"
              element={
                <ProfilePage
                  user={user}
                  refetch={refetch}
                  onLogout={logout}
                />
              }
            />

            {/* Catch-all → send to role-specific home */}
            <Route path="*" element={<Navigate to={homePath} replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
