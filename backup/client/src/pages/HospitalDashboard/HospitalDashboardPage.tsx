import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type { BloodRequest, User } from "../../types";

interface HospitalDashboardProps {
  user: User;
}

interface DonorSummary {
  _id: string;
  name: string;
  bloodGroup: string;
  availability: boolean;
  trustRating?: number;
  totalDonations?: number;
  lastDonationDate?: string;
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const daysSince = (dateStr?: string) => {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
};

const HospitalDashboardPage = ({ user }: HospitalDashboardProps) => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donors, setDonors] = useState<DonorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [bloodFilter, setBloodFilter] = useState<string>("all");
  const [lastDonationFilter, setLastDonationFilter] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, donorRes] = await Promise.all([
          fetch("/api/v1/requests/my-requests", { credentials: "include" }),
          fetch("/api/v1/users/donors", { credentials: "include" }),
        ]);

        if (reqRes.ok) {
          const reqData = await reqRes.json();
          setRequests(reqData.data?.requests ?? reqData.data ?? []);
        }

        if (donorRes.ok) {
          const donorData = await donorRes.json();
          setDonors(donorData.data ?? []);
        }
      } catch {
        toast.error("Failed to load hospital dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const trackedRequests = useMemo(() => {
    return requests.map((request) => {
      const expired = request.expiresAt ? new Date(request.expiresAt).getTime() < Date.now() : false;
      return { ...request, expired: expired && request.status !== "fulfilled" && request.status !== "cancelled" };
    });
  }, [requests]);

  const filteredDonors = useMemo(() => {
    return donors.filter((donor) => {
      if (bloodFilter !== "all" && donor.bloodGroup !== bloodFilter) return false;
      const age = daysSince(donor.lastDonationDate);
      if (lastDonationFilter === "eligible" && age < 90) return false;
      if (lastDonationFilter === "cooldown" && age >= 90) return false;
      return true;
    });
  }, [bloodFilter, donors, lastDonationFilter]);

  const requestStats = {
    pending: trackedRequests.filter((r) => r.status === "pending").length,
    accepted: trackedRequests.filter((r) => r.status === "accepted").length,
    fulfilled: trackedRequests.filter((r) => r.status === "fulfilled").length,
    expired: trackedRequests.filter((r) => (r as BloodRequest & { expired?: boolean }).expired).length,
  };

  const inventory = useMemo(() => {
    return bloodGroups.map((group) => {
      const groupDonors = donors.filter((donor) => donor.bloodGroup === group);
      const available = groupDonors.filter((donor) => donor.availability).length;
      const eligible = groupDonors.filter((donor) => daysSince(donor.lastDonationDate) >= 90).length;
      return {
        group,
        available,
        eligible,
        low: available < 3,
      };
    });
  }, [donors]);

  const successRate = requests.length > 0 ? Math.round((requestStats.fulfilled / requests.length) * 100) : 0;

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">progress_activity</span>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <section className="rounded-3xl bg-linear-to-br from-primary to-primary-container text-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(183,28,28,0.18)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
              Hospital Dashboard
            </div>
            <div>
              <h2 className="font-headline text-3xl sm:text-4xl font-black tracking-tight">{user.hospitalDetails?.hospitalName || user.name}</h2>
              <p className="mt-2 text-white/80 text-sm sm:text-base max-w-2xl">
                Manage emergency requests, donor matching, inventory, and hospital reports from one trusted workspace.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto lg:min-w-[360px]">
            {[
              { label: "Pending", value: requestStats.pending },
              { label: "Accepted", value: requestStats.accepted },
              { label: "Fulfilled", value: requestStats.fulfilled },
              { label: "Expired", value: requestStats.expired },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-widest text-white/70 font-bold">{item.label}</div>
                <div className="mt-1 text-2xl font-black">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Requests", value: requests.length },
          { label: "Success Rate", value: `${successRate}%` },
          { label: "Active Donors", value: donors.filter((d) => d.availability).length },
          { label: "Eligible Donors", value: donors.filter((d) => daysSince(d.lastDonationDate) >= 90).length },
          { label: "Low Stock Alerts", value: inventory.filter((item) => item.low).length },
        ].map((item) => (
          <div key={item.label} className="bg-surface-container-lowest p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col gap-2">
            <span className="text-secondary font-semibold text-xs uppercase tracking-wider">{item.label}</span>
            <span className="text-3xl font-headline font-black text-on-surface">{item.value}</span>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-headline font-bold text-xl">Request Tracking</h3>
              <p className="text-sm text-secondary">Pending, accepted, fulfilled, and expired requests.</p>
            </div>
            <button onClick={() => navigate("/create-request")} className="rounded-2xl bg-primary text-white px-4 py-3 text-sm font-bold">
              Create Emergency Request
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Pending", value: requestStats.pending },
              { label: "Accepted", value: requestStats.accepted },
              { label: "Fulfilled", value: requestStats.fulfilled },
              { label: "Expired", value: requestStats.expired },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-surface-container-low p-4 text-center">
                <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">{item.label}</div>
                <div className="mt-1 text-2xl font-black text-on-surface">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {trackedRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/20 p-8 text-center text-secondary">No requests yet.</div>
            ) : (
              trackedRequests.slice(0, 6).map((request) => (
                <div key={request._id} className="rounded-2xl bg-white p-4 ring-1 ring-outline-variant/10 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface truncate">{request.patientName} · {request.bloodGroup}</p>
                    <p className="text-xs text-secondary">
                      {request.hospitalName || "Hospital"} · {request.status}{request.expiresAt ? ` · expires ${new Date(request.expiresAt).toLocaleString()}` : ""}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${request.status === "fulfilled" ? "bg-green-100 text-green-700" : request.status === "accepted" ? "bg-blue-100 text-blue-700" : request.status === "cancelled" ? "bg-gray-100 text-gray-600" : "bg-amber-100 text-amber-800"}`}>
                    {request.expired ? "expired" : request.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
            <div>
              <h3 className="font-headline font-bold text-xl">Donor Matching</h3>
              <p className="text-sm text-secondary">Chat, call, and filter nearby donors.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate("/requester/donors-near-me")} className="rounded-2xl bg-primary text-white px-4 py-3 font-bold">Open Donor Panel</button>
              <button onClick={() => navigate("/requests")} className="rounded-2xl bg-surface-container-highest text-primary px-4 py-3 font-bold">Request List</button>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4 text-sm text-secondary">
              Use the donor panel to chat with donors, call directly, and filter by blood group, availability, and last donation date.
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
            <div>
              <h3 className="font-headline font-bold text-xl">Hospital Profile</h3>
              <p className="text-sm text-secondary">Verification and contact details.</p>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="font-bold text-on-surface">License:</span> {user.hospitalDetails?.licenseNumber || "Not provided"}</div>
              <div><span className="font-bold text-on-surface">Registration:</span> {user.hospitalDetails?.registrationNumber || "Not provided"}</div>
              <div><span className="font-bold text-on-surface">Contact:</span> {user.hospitalDetails?.hospitalPhone || user.contactNumber || "Not provided"}</div>
              <div><span className="font-bold text-on-surface">Verification:</span> {user.isVerified ? "Verified" : "Pending"}</div>
            </div>
          </section>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
          <div>
            <h3 className="font-headline font-bold text-xl">Blood Inventory</h3>
            <p className="text-sm text-secondary">Estimated stock based on available donor pool.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {bloodGroups.map((group) => (
              <button key={group} onClick={() => setBloodFilter(group)} className={`rounded-full px-3 py-2 text-xs font-bold ${bloodFilter === group ? "bg-primary text-white" : "bg-surface-container-highest text-secondary"}`}>
                {group}
              </button>
            ))}
            <button onClick={() => setBloodFilter("all")} className={`rounded-full px-3 py-2 text-xs font-bold ${bloodFilter === "all" ? "bg-primary text-white" : "bg-surface-container-highest text-secondary"}`}>
              All
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {inventory.filter((item) => bloodFilter === "all" || item.group === bloodFilter).map((item) => (
              <div key={item.group} className={`rounded-2xl p-4 ${item.low ? "bg-amber-50" : "bg-surface-container-low"}`}>
                <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">{item.group}</div>
                <div className="mt-1 text-2xl font-black text-on-surface">{item.available}</div>
                <div className="text-xs text-secondary">available</div>
                <div className="mt-2 text-[11px] font-bold text-secondary">Eligible: {item.eligible}</div>
                {item.low && <div className="mt-2 text-[11px] font-bold text-amber-800">Low stock alert</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
          <div>
            <h3 className="font-headline font-bold text-xl">Reports</h3>
            <p className="text-sm text-secondary">Donation records and request success rates.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-container-low p-4 text-center">
              <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">Request Success</div>
              <div className="mt-1 text-3xl font-black text-on-surface">{successRate}%</div>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4 text-center">
              <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">Donation Records</div>
              <div className="mt-1 text-3xl font-black text-on-surface">{donors.reduce((sum, donor) => sum + (donor.totalDonations || 0), 0)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-on-surface">Donor Filters</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={bloodFilter} onChange={(e) => setBloodFilter(e.target.value)} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-on-surface outline-none">
                <option value="all">All blood groups</option>
                {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
              <select value={lastDonationFilter} onChange={(e) => setLastDonationFilter(e.target.value)} className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-on-surface outline-none">
                <option value="all">All last donation dates</option>
                <option value="eligible">90+ days ago</option>
                <option value="cooldown">Under 90 days</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-auto pr-1">
            {filteredDonors.slice(0, 8).map((donor) => (
              <div key={donor._id} className="rounded-2xl bg-white p-4 ring-1 ring-outline-variant/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface truncate">{donor.name} · {donor.bloodGroup}</p>
                  <p className="text-xs text-secondary">{donor.availability ? "Available" : "Unavailable"} · {donor.lastDonationDate ? `${daysSince(donor.lastDonationDate)} days since last donation` : "No donation history"}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate("/requester/donors-near-me")} className="rounded-xl bg-primary text-white px-3 py-2 text-xs font-bold">Chat / Call</button>
                </div>
              </div>
            ))}
            {filteredDonors.length === 0 && <div className="rounded-2xl border border-dashed border-outline-variant/20 p-8 text-center text-secondary">No donors match this filter.</div>}
          </div>
        </div>
      </section>
    </main>
  );
};

export default HospitalDashboardPage;
