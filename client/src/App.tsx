import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/useAuth";
import RegisterPage from "./pages/Register";
import LoginPage from "./pages/Login";
import DashboardPage from "./pages/Dashboard";
import RequestsPage from "./pages/Requests";
import CreateRequestPage from "./pages/CreateRequest";
import DonorsPage from "./pages/Donors";
import ProfilePage from "./pages/Profile";
import DashboardLayout from "./components/layout/DashboardLayout";

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

  return (
    <BrowserRouter>
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
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />

        {/* Protected routes */}
        {user ? (
          <Route element={<DashboardLayout onLogout={logout} />}>
            <Route
              path="/dashboard"
              element={<DashboardPage user={user} refetch={refetch} />}
            />
            <Route
              path="/requests"
              element={<RequestsPage user={user} />}
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
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
