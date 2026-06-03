import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { User, BloodRequest } from "../../types";
import { API_BASE_URL } from "../../utils/apiConfig";

interface RequesterDashboardPageProps {
  user: User;
}

const urgencyBadge: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-error-container", text: "text-on-error-container" },
  high: { bg: "bg-primary-fixed", text: "text-on-primary-fixed-variant" },
  medium: { bg: "bg-secondary-fixed", text: "text-on-secondary-fixed-variant" },
  low: { bg: "bg-surface-container-high", text: "text-secondary" },
};

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const RequesterDashboardPage = ({ user }: RequesterDashboardPageProps) => {
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyRequests = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/requests/my-requests`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setMyRequests(data.data?.requests ?? data.data ?? []);
        }
      } catch {
        toast.error("Failed to load your requests.");
      } finally {
        setLoading(false);
      }
    };
    fetchMyRequests();
  }, []);

  const pendingCount = myRequests.filter((r) => r.status === "pending").length;
  const acceptedCount = myRequests.filter((r) => r.status === "accepted").length;
  const fulfilledCount = myRequests.filter(
    (r) => r.status === "fulfilled"
  ).length;

  return (
    <main className="max-w-5xl mx-auto px-6 space-y-10">
      {/* Profile Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-surface-container-low bg-surface-container-high flex items-center justify-center">
              <span
                className="material-symbols-outlined text-primary text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                person
              </span>
            </div>
            <div>
              <h2 className="font-headline font-extrabold text-2xl tracking-tight">
                {user.name}
              </h2>
              <span className="text-xs font-bold uppercase tracking-widest text-tertiary bg-tertiary-fixed px-2 py-0.5 rounded-full">
                Requester
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate("/requester/donors-near-me")}
            className="bg-primary/10 text-primary rounded-xl py-3 px-5 font-bold flex items-center gap-2 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              person_search
            </span>
            Donors Near Me
          </button>
          <button
            onClick={() => navigate("/create-request")}
            className="bg-signature-gradient text-white rounded-xl py-3 px-6 font-bold flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              bolt
            </span>
            New Request
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between h-36 group">
          <span className="text-secondary font-semibold text-xs uppercase tracking-wider">
            Pending
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-headline font-black text-primary">
              {pendingCount}
            </span>
            <span className="text-secondary font-bold">requests</span>
          </div>
          <div className="h-1 bg-signature-gradient w-full rounded-full opacity-30 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between h-36 border-l-4 border-tertiary">
          <span className="text-secondary font-semibold text-xs uppercase tracking-wider">
            Accepted
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-headline font-black text-tertiary">
              {acceptedCount}
            </span>
            <span className="text-secondary font-bold">donors matched</span>
          </div>
          <p className="text-[10px] text-secondary font-medium italic">
            Donors on the way
          </p>
        </div>

        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between h-36 bg-gradient-to-br from-primary-container to-primary text-white">
          <div className="flex justify-between items-start">
            <span className="font-semibold text-xs uppercase tracking-wider opacity-80">
              Fulfilled
            </span>
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <span className="text-5xl font-headline font-black">{fulfilledCount}</span>
          <span className="text-xs font-medium opacity-70">Lives saved</span>
        </div>
      </section>

      {/* My Requests */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-headline font-extrabold text-2xl tracking-tight">
            My Requests
          </h3>
          <button
            onClick={() => navigate("/requests")}
            className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
          >
            Browse All
            <span className="material-symbols-outlined text-xs">
              arrow_forward
            </span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">
              progress_activity
            </span>
          </div>
        ) : myRequests.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-12 text-center space-y-4">
            <span className="material-symbols-outlined text-5xl text-secondary/30">
              bloodtype
            </span>
            <p className="text-secondary font-medium">
              You haven't made any requests yet.
            </p>
            <button
              onClick={() => navigate("/create-request")}
              className="text-primary font-bold hover:underline"
            >
              Create your first request
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map((req) => {
              const badge = urgencyBadge[req.urgency] ?? urgencyBadge.low;
              return (
                <div
                  key={req._id}
                  className="bg-surface-container-lowest rounded-2xl p-5 ring-1 ring-surface-container hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 items-start">
                      <div
                        className={`w-12 h-12 rounded-xl ${badge.bg} flex items-center justify-center shrink-0`}
                      >
                        <span
                          className={`font-headline font-black text-sm ${badge.text}`}
                        >
                          {req.bloodGroup}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-headline font-bold text-base text-on-surface">
                            {req.patientName}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} text-[10px] font-black uppercase tracking-wider`}
                          >
                            {req.urgency}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-secondary">
                          <span>
                            {req.unitsRequired} unit
                            {req.unitsRequired > 1 ? "s" : ""}
                          </span>
                          {req.location?.city && (
                            <span className="flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-xs">
                                location_on
                              </span>
                              {req.location.city}
                            </span>
                          )}
                          <span>{timeAgo(req.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full shrink-0 ${
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
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default RequesterDashboardPage;
