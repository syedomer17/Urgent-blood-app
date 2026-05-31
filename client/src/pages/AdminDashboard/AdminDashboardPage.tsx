import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import type {
  AdminAuditLog,
  AdminReports,
  AdminStats,
  BloodRequest,
  User,
} from "../../types";

interface AdminDashboardPageProps {
  user: User;
}

type UserFilter = "all" | "donor" | "requester" | "hospital" | "admin";
type RequestFilter = "all" | "pending" | "accepted" | "fulfilled" | "cancelled";

const apiGet = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error(url);
  }
  const data = await res.json();
  return data.data as T;
};

const AdminDashboardPage = ({ user }: AdminDashboardPageProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [reports, setReports] = useState<AdminReports | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("all");
  const [alertBloodGroup, setAlertBloodGroup] = useState("O-");
  const [alertRegion, setAlertRegion] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const loadData = async () => {
    try {
      const [statsData, usersData, requestsData, reportsData, auditLogsData] = await Promise.all([
        apiGet<AdminStats>("/api/v1/admin/stats"),
        apiGet<User[]>("/api/v1/admin/users"),
        apiGet<BloodRequest[]>("/api/v1/admin/requests"),
        apiGet<AdminReports>("/api/v1/admin/reports"),
        apiGet<AdminAuditLog[]>("/api/v1/admin/audit-logs"),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setRequests(requestsData);
      setReports(reportsData);
      setAuditLogs(auditLogsData);
    } catch {
      toast.error("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    if (userFilter === "all") return users;
    return users.filter((entry) => entry.role === userFilter);
  }, [users, userFilter]);

  const filteredRequests = useMemo(() => {
    if (requestFilter === "all") return requests;
    return requests.filter((entry) => entry.status === requestFilter);
  }, [requests, requestFilter]);

  const refreshSection = async () => {
    await loadData();
  };

  const mutate = async (url: string, method: "PATCH" | "POST", body?: unknown, successMessage?: string) => {
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(url);
    }
    if (successMessage) {
      toast.success(successMessage);
    }
    await refreshSection();
  };

  const updateUserStatus = async (id: string, action: "suspend" | "activate" | "block") => {
    const messageMap = {
      suspend: "User suspended successfully",
      activate: "User activated successfully",
      block: "User blocked successfully",
    };
    await mutate(`/api/v1/admin/users/${id}/${action}`, "PATCH", undefined, messageMap[action]);
  };

  const updateRequestStatus = async (
    id: string,
    action: "approve-emergency" | "reject-emergency" | "fulfill" | "cancel",
    body?: { reason?: string }
  ) => {
    await mutate(`/api/v1/admin/requests/${id}/${action}`, "PATCH", body, "Request updated successfully");
  };

  const sendEmergencyAlert = async () => {
    if (!alertMessage.trim()) {
      toast.error("Please enter an alert message.");
      return;
    }
    await mutate(
      "/api/v1/admin/alerts/emergency",
      "POST",
      {
        bloodGroup: alertBloodGroup,
        region: alertRegion,
        message: alertMessage,
      },
      "Emergency alert sent"
    );
    setAlertMessage("");
    setAlertRegion("");
    setAlertBloodGroup("O-");
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center">
        <span className="material-symbols-outlined animate-spin text-5xl text-primary">
          progress_activity
        </span>
      </main>
    );
  }

  const statCards = [
    { label: "Total Donors", value: stats?.totalDonors ?? 0 },
    { label: "Active Donors", value: stats?.activeDonors ?? 0 },
    { label: "Requests Today", value: stats?.bloodRequestsToday ?? 0 },
    { label: "Emergency Requests", value: stats?.emergencyRequests ?? 0 },
    { label: "Fulfilled Requests", value: stats?.fulfilledRequests ?? 0 },
    { label: "Completed Donations", value: stats?.completedDonations ?? 0 },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      <section className="rounded-3xl bg-linear-to-br from-primary to-primary-container text-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(183,28,28,0.18)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                admin_panel_settings
              </span>
              Admin Control Center
            </div>
            <div>
              <h2 className="font-headline text-3xl sm:text-4xl font-black tracking-tight">{user.name}</h2>
              <p className="mt-2 text-white/80 text-sm sm:text-base max-w-2xl">
                Manage users, moderate requests, broadcast emergency alerts, and review audit activity from one dashboard.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            {statCards.slice(0, 3).map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
                <div className="text-[10px] uppercase tracking-widest text-white/70 font-bold">{item.label}</div>
                <div className="mt-1 text-2xl font-black">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {statCards.map((item) => (
          <div key={item.label} className="bg-surface-container-lowest p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col gap-2">
            <span className="text-secondary font-semibold text-xs uppercase tracking-wider">{item.label}</span>
            <span className="text-3xl font-headline font-black text-on-surface">{item.value}</span>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
        <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-headline font-bold text-xl">User Management</h3>
              <p className="text-sm text-secondary">Suspend, activate, or block accounts.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "donor", "requester", "hospital", "admin"] as UserFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setUserFilter(filter)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    userFilter === filter
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "bg-surface-container-highest text-secondary hover:bg-surface-container-high"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-outline-variant/10">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-secondary">No users found.</div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {filteredUsers.map((entry) => (
                  <div key={entry._id} className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[1.4fr_0.8fr_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-on-surface truncate">{entry.name}</p>
                        <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-secondary">
                          {entry.role}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${entry.accountStatus === "blocked" ? "bg-red-100 text-red-700" : entry.accountStatus === "suspended" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>
                          {entry.accountStatus || "active"}
                        </span>
                      </div>
                      <p className="text-sm text-secondary truncate">{entry.email}</p>
                    </div>

                    <div className="text-sm text-secondary">
                      <p>{entry.contactNumber || "No contact number"}</p>
                      <p>{entry.hospitalDetails?.hospitalName || entry.bloodGroup || "General account"}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-start md:justify-end">
                      <button onClick={() => updateUserStatus(entry._id, "activate")} className="rounded-xl bg-green-600 px-3 py-2 text-sm font-bold text-white">
                        Activate
                      </button>
                      <button onClick={() => updateUserStatus(entry._id, "suspend")} className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-bold text-white">
                        Suspend
                      </button>
                      <button onClick={() => updateUserStatus(entry._id, "block")} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white">
                        Block
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
            <div>
              <h3 className="font-headline font-bold text-xl">Emergency Alerts</h3>
              <p className="text-sm text-secondary">Broadcast region-specific alerts to compatible donors.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <label className="space-y-1 text-sm font-medium text-secondary">
                Blood Group
                <select
                  value={alertBloodGroup}
                  onChange={(e) => setAlertBloodGroup(e.target.value)}
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-on-surface outline-none"
                >
                  {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium text-secondary">
                Region
                <input
                  value={alertRegion}
                  onChange={(e) => setAlertRegion(e.target.value)}
                  placeholder="Optional region or city"
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-on-surface outline-none"
                />
              </label>
              <label className="space-y-1 text-sm font-medium text-secondary">
                Message
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  rows={4}
                  placeholder="Need urgent O- donors in the north district."
                  className="w-full rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 text-on-surface outline-none"
                />
              </label>
              <button onClick={sendEmergencyAlert} className="rounded-2xl bg-signature-gradient px-4 py-3 font-bold text-white">
                Send Emergency Alert
              </button>
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
            <div>
              <h3 className="font-headline font-bold text-xl">Quick Links</h3>
              <p className="text-sm text-secondary">Open verification review or create new requests.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => navigate("/admin/verifications")} className="rounded-2xl bg-primary text-white px-4 py-3 font-bold">
                Review Verifications
              </button>
              <button onClick={() => navigate("/create-request")} className="rounded-2xl bg-surface-container-highest text-primary px-4 py-3 font-bold">
                New Request
              </button>
              <button onClick={() => navigate("/requests")} className="rounded-2xl bg-surface-container-highest text-primary px-4 py-3 font-bold">
                All Requests
              </button>
              <button onClick={() => navigate("/donors")} className="rounded-2xl bg-surface-container-highest text-primary px-4 py-3 font-bold">
                All Donors
              </button>
            </div>
          </section>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-headline font-bold text-xl">Blood Request Moderation</h3>
            <p className="text-sm text-secondary">Approve emergency requests, mark fulfilled requests, or cancel fraudulent ones.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "accepted", "fulfilled", "cancelled"] as RequestFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setRequestFilter(filter)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                  requestFilter === filter
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-surface-container-highest text-secondary hover:bg-surface-container-high"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant/20 p-8 text-center text-secondary">No requests found.</div>
          ) : (
            filteredRequests.map((requestItem) => (
              <article key={requestItem._id} className="rounded-3xl border border-outline-variant/15 bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-headline text-lg font-black text-on-surface truncate">{requestItem.patientName}</h4>
                      <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                        {requestItem.bloodGroup}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${requestItem.urgency === "critical" ? "bg-red-100 text-red-700" : "bg-surface-container-high text-secondary"}`}>
                        {requestItem.urgency}
                      </span>
                      <span className="rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-secondary">
                        {requestItem.status}
                      </span>
                    </div>
                    <p className="text-sm text-secondary truncate">
                      {requestItem.hospitalName || "Hospital not specified"} · {requestItem.requesterid?.name || "Unknown requester"}
                    </p>
                    <p className="text-sm text-secondary">Units: {requestItem.unitsRequired} · Contact: {requestItem.contactNumber}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateRequestStatus(requestItem._id, "approve-emergency")}
                      className="rounded-xl bg-green-600 px-3 py-2 text-sm font-bold text-white"
                    >
                      Approve Emergency
                    </button>
                    <button
                      onClick={() => updateRequestStatus(requestItem._id, "reject-emergency", { reason: "Rejected by admin" })}
                      className="rounded-xl bg-amber-600 px-3 py-2 text-sm font-bold text-white"
                    >
                      Reject Emergency
                    </button>
                    <button
                      onClick={() => updateRequestStatus(requestItem._id, "fulfill")}
                      className="rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white"
                    >
                      Mark Fulfilled
                    </button>
                    <button
                      onClick={() => updateRequestStatus(requestItem._id, "cancel", { reason: "Cancelled by admin" })}
                      className="rounded-xl bg-red-600 px-3 py-2 text-sm font-bold text-white"
                    >
                      Cancel Fraudulent
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
          <div>
            <h3 className="font-headline font-bold text-xl">Reports</h3>
            <p className="text-sm text-secondary">Donation history, hospital activity, and request fulfillment summaries.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface-container-low p-4">
              <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">Hospitals</div>
              <div className="mt-1 text-2xl font-black text-on-surface">{reports?.hospitalActivity.length ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">Fulfillment Rows</div>
              <div className="mt-1 text-2xl font-black text-on-surface">{reports?.requestFulfillment.length ?? 0}</div>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">Donation States</div>
              <div className="mt-1 text-2xl font-black text-on-surface">{reports?.donationHistory.length ?? 0}</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-on-surface">Hospital Activity Reports</h4>
            <div className="space-y-2">
              {reports?.hospitalActivity.slice(0, 5).map((row) => (
                <div key={row._id || "unknown"} className="rounded-2xl bg-white p-3 ring-1 ring-outline-variant/10 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface truncate">{row._id || "Unknown hospital"}</p>
                    <p className="text-xs text-secondary">Fulfilled: {row.fulfilledRequests} · Cancelled: {row.cancelledRequests}</p>
                  </div>
                  <span className="font-black text-primary">{row.totalRequests}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-on-surface">Request Fulfillment Reports</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {reports?.requestFulfillment.map((row) => (
                <div key={row._id} className="rounded-2xl bg-white p-4 ring-1 ring-outline-variant/10">
                  <div className="text-[10px] uppercase tracking-widest text-secondary font-bold">{row._id}</div>
                  <div className="mt-1 text-2xl font-black text-on-surface">{row.count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] space-y-4">
          <div>
            <h3 className="font-headline font-bold text-xl">Audit Logs</h3>
            <p className="text-sm text-secondary">Who changed what, and when.</p>
          </div>

          <div className="space-y-3 max-h-180 overflow-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant/20 p-8 text-center text-secondary">No audit logs yet.</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log._id} className="rounded-2xl bg-white p-4 ring-1 ring-outline-variant/10 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-on-surface truncate">{log.action}</p>
                    <span className="text-xs text-secondary">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-secondary">
                    {log.targetType}
                    {log.actorId?.name ? ` · by ${log.actorId.name}` : ""}
                  </p>
                  {log.metadata && (
                    <pre className="overflow-auto rounded-xl bg-surface-container-low p-3 text-[11px] text-secondary">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboardPage;
