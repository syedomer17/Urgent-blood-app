import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { BloodRequest, User } from "../../types";

interface RequestsPageProps {
  user: User;
}

const urgencyStyles: Record<string, { bg: string; text: string; badge: string }> = {
  critical: { bg: "bg-error-container", text: "text-on-error-container", badge: "ring-error/20" },
  high: { bg: "bg-primary-fixed", text: "text-on-primary-fixed-variant", badge: "ring-primary/20" },
  medium: { bg: "bg-secondary-fixed", text: "text-on-secondary-fixed-variant", badge: "ring-secondary/20" },
  low: { bg: "bg-surface-container-high", text: "text-secondary", badge: "ring-outline/20" },
};

const bloodGroupBg: Record<string, string> = {
  critical: "bg-error-container",
  high: "bg-primary-fixed",
  medium: "bg-secondary-container",
  low: "bg-surface-container-high",
};

const RequestsPage = ({ user }: RequestsPageProps) => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bloodFilter, setBloodFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/v1/requests", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data?.requests ?? data.data ?? []);
      }
    } catch {
      toast.error("Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAccept = async (requestId: string) => {
    try {
      const res = await fetch("/api/v1/donations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to accept.");
        return;
      }
      toast.success("Request accepted! Thank you for donating.");
      fetchRequests();
    } catch {
      toast.error("Network error.");
    }
  };

  const filtered = requests.filter((r) => {
    if (bloodFilter && r.bloodGroup !== bloodFilter) return false;
    if (urgencyFilter && r.urgency !== urgencyFilter) return false;
    return true;
  });

  return (
    <main className="pt-4 pb-8 px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div className="space-y-1">
          <span className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Active Community
          </span>
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
            Blood Requests
          </h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-10 overflow-x-auto pb-2">
        <div className="relative">
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            className="appearance-none bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:ring-primary focus:ring-2 transition-all outline-none"
          >
            <option value="">Blood Group</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-2.5 text-secondary pointer-events-none text-lg">
            expand_more
          </span>
        </div>
        <div className="relative">
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="appearance-none bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:ring-primary focus:ring-2 transition-all outline-none"
          >
            <option value="">Urgency</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <span className="material-symbols-outlined absolute right-3 top-2.5 text-secondary pointer-events-none text-lg">
            expand_more
          </span>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-secondary/30 mb-4">
            inbox
          </span>
          <p className="text-secondary font-medium">No requests found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filtered.map((req) => {
            const style = urgencyStyles[req.urgency] ?? urgencyStyles.low;
            const bgColor = bloodGroupBg[req.urgency] ?? "bg-surface-container-high";

            return (
              <div
                key={req._id}
                className="group relative bg-surface-container-lowest rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-black/5 ring-1 ring-surface-container"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-5">
                    <div
                      className={`w-16 h-16 rounded-2xl ${bgColor} flex items-center justify-center shrink-0`}
                    >
                      <span
                        className={`font-headline font-black text-xl ${style.text}`}
                      >
                        {req.bloodGroup}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-headline font-bold text-lg text-on-surface">
                          {req.patientName}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-full ${style.bg} text-[10px] font-black uppercase tracking-wider ${style.text} ring-1 ${style.badge}`}
                        >
                          {req.urgency}
                        </span>
                      </div>
                      {req.location?.address && (
                        <p className="text-sm text-secondary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-base">
                            location_on
                          </span>
                          {req.location.address}
                          {req.location.city && `, ${req.location.city}`}
                        </p>
                      )}
                      <div className="pt-2 flex gap-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                            Units Needed
                          </span>
                          <span className="text-sm font-bold text-on-surface">
                            {req.unitsRequired} Unit{req.unitsRequired > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="w-px h-8 bg-surface-container-high" />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                            Status
                          </span>
                          <span className="text-sm font-bold text-primary capitalize">
                            {req.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {user.role === "donor" && req.status === "pending" && (
                    <button
                      onClick={() => handleAccept(req._id)}
                      className="bg-gradient-to-br from-primary-container to-primary text-white px-6 py-3 rounded-xl font-bold text-sm tracking-tight active:scale-95 transition-all shadow-md shadow-primary/20"
                    >
                      Help Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default RequestsPage;
