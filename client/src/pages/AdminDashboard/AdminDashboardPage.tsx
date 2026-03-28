import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { AdminStats, User, BloodRequest } from "../../types";

interface AdminDashboardPageProps {
  user: User;
}

const AdminDashboardPage = ({ user }: AdminDashboardPageProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, reqRes] = await Promise.all([
          fetch("/api/v1/admin/stats", { credentials: "include" }),
          fetch("/api/v1/requests", { credentials: "include" }),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }
        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRequests(reqData.data?.requests ?? reqData.data ?? []);
        }
      } catch {
        toast.error("Failed to load admin data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-20 text-center">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">
          progress_activity
        </span>
      </main>
    );
  }

  const recentRequests = requests.slice(0, 5);

  return (
    <main className="max-w-5xl mx-auto px-6 space-y-10">
      {/* Admin Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-container to-primary flex items-center justify-center">
              <span
                className="material-symbols-outlined text-white text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                admin_panel_settings
              </span>
            </div>
            <div>
              <h2 className="font-headline font-extrabold text-2xl tracking-tight">
                {user.name}
              </h2>
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary-fixed px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate("/create-request")}
          className="bg-signature-gradient text-white rounded-xl py-3 px-6 font-bold flex items-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add</span>
          Create Request
        </button>
      </section>

      {/* Stats Overview */}
      {stats && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col gap-2">
            <span className="text-secondary font-semibold text-xs uppercase tracking-wider">
              Total Donors
            </span>
            <span className="text-4xl font-headline font-black text-on-surface">
              {stats.totalDonors}
            </span>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col gap-2">
            <span className="text-secondary font-semibold text-xs uppercase tracking-wider">
              Active Requests
            </span>
            <span className="text-4xl font-headline font-black text-primary">
              {stats.activeRequests}
            </span>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col gap-2">
            <span className="text-secondary font-semibold text-xs uppercase tracking-wider">
              Completed Donations
            </span>
            <span className="text-4xl font-headline font-black text-tertiary">
              {stats.completedDonations}
            </span>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col gap-2">
            <span className="text-secondary font-semibold text-xs uppercase tracking-wider">
              Avg Response
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-headline font-black text-on-surface">
                {parseFloat(stats.averageResponseTimeMinutes || "0").toFixed(0)}
              </span>
              <span className="text-sm text-secondary font-bold">min</span>
            </div>
          </div>
        </section>
      )}

      {/* Blood Group Distribution */}
      {stats && stats.bloodGroupDistribution.length > 0 && (
        <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)]">
          <h3 className="font-headline font-bold text-xl mb-6">
            Blood Group Distribution
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {stats.bloodGroupDistribution.map((item) => (
              <div
                key={item._id}
                className="bg-surface-container-low rounded-xl p-4 text-center"
              >
                <span className="font-headline font-black text-lg text-primary">
                  {item._id}
                </span>
                <p className="text-xs text-secondary font-bold mt-1">
                  {item.count}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Requests */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-headline font-bold text-xl">Recent Requests</h3>
          <button
            onClick={() => navigate("/requests")}
            className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
          >
            View All
            <span className="material-symbols-outlined text-xs">
              arrow_forward
            </span>
          </button>
        </div>

        {recentRequests.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center">
            <p className="text-secondary font-medium">No requests yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRequests.map((req) => (
              <div
                key={req._id}
                className="bg-surface-container-lowest rounded-xl p-4 ring-1 ring-surface-container flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      req.urgency === "critical"
                        ? "bg-error-container"
                        : req.urgency === "high"
                          ? "bg-primary-fixed"
                          : "bg-surface-container-high"
                    }`}
                  >
                    <span className="font-headline font-black text-sm text-on-surface">
                      {req.bloodGroup}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">
                      {req.patientName}
                    </p>
                    <p className="text-xs text-secondary">
                      {req.unitsRequired} unit{req.unitsRequired > 1 ? "s" : ""}{" "}
                      &middot; {req.urgency}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                    req.status === "pending"
                      ? "bg-primary-fixed text-primary"
                      : req.status === "accepted"
                        ? "bg-secondary-fixed text-tertiary"
                        : "bg-surface-container-high text-secondary"
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate("/requests")}
          className="bg-surface-container-highest text-primary rounded-xl py-4 px-6 font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">bloodtype</span>
          All Requests
        </button>
        <button
          onClick={() => navigate("/donors")}
          className="bg-surface-container-highest text-primary rounded-xl py-4 px-6 font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">group</span>
          All Donors
        </button>
        <button
          onClick={() => navigate("/create-request")}
          className="bg-surface-container-lowest border border-outline-variant/20 text-on-surface rounded-xl py-4 px-6 font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add_circle</span>
          New Request
        </button>
      </section>
    </main>
  );
};

export default AdminDashboardPage;
