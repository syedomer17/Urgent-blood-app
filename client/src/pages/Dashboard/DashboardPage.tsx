import { useEffect, useState } from "react";
import type { User, BloodRequest } from "../../types";
import StatsGrid from "../../components/dashboard/StatsGrid";
import QuickActions from "../../components/dashboard/QuickActions";
import RequestCard from "../../components/dashboard/RequestCard";

interface DashboardPageProps {
  user: User;
  refetch: () => void;
}

const DashboardPage = ({ user, refetch }: DashboardPageProps) => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/v1/requests", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data?.requests ?? data.data ?? []);
      }
    } catch {
      /* silently fail */
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const toggleAvailability = async () => {
    await fetch("/api/v1/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ availability: !user.availability }),
    });
    refetch();
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <main className="max-w-5xl mx-auto px-6 space-y-10">
      {/* User Profile Summary */}
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
              <div className="flex items-center gap-2 text-secondary font-medium">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span className="text-sm">
                  Trust Rating {user.trustRating?.toFixed(1) ?? "0.0"}/5
                </span>
              </div>
            </div>
          </div>
        </div>
        {user.bloodGroup && (
          <div className="flex flex-col items-end">
            <span className="font-headline font-black text-4xl text-primary leading-none">
              {user.bloodGroup}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-secondary mt-1">
              Blood Group
            </span>
          </div>
        )}
      </section>

      {/* Stats */}
      <StatsGrid user={user} />

      {/* Quick Actions */}
      <QuickActions user={user} onToggleAvailability={toggleAvailability} />

      {/* Today's Need */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <h2 className="font-headline font-extrabold text-2xl tracking-tight ml-4">
            Today's Need
          </h2>
          <a
            href="/requests"
            className="text-primary font-bold text-sm flex items-center gap-1 hover:underline"
          >
            See All
            <span className="material-symbols-outlined text-xs">
              arrow_forward
            </span>
          </a>
        </div>
        {pendingRequests.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-secondary/40 mb-2">
              check_circle
            </span>
            <p className="text-secondary font-medium">
              No pending requests right now. Check back later!
            </p>
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide -mx-6 px-6">
            {pendingRequests.slice(0, 6).map((req) => (
              <RequestCard
                key={req._id}
                request={req}
                userRole={user.role}
                onAccepted={fetchRequests}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;
