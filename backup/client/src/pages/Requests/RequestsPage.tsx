import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import type { BloodRequest, User } from "../../types";
import { canDonateTo } from "../../utils/bloodCompatibility";

interface RequestsPageProps {
  user: User;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface MatchedDonor {
  _id: string;
  name: string;
  bloodGroup: string;
  availability: boolean;
  trustRating: number;
  totalDonations: number;
  lastDonationDate?: string;
  distanceMetres: number;
  isOnline?: boolean;
  contactNumber?: string;
  location?: { city?: string };
}

type SortKey = "distance" | "lastDonation" | "active" | "rating";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  critical: { color: "#dc2626", bg: "#fef2f2", icon: "emergency", label: "Emergency" },
  high:     { color: "#ea580c", bg: "#fff7ed", icon: "warning", label: "High" },
  medium:   { color: "#d97706", bg: "#fffbeb", icon: "priority_high", label: "Urgent" },
  low:      { color: "#16a34a", bg: "#f0fdf4", icon: "schedule", label: "Normal" },
};

function fmtDist(metres: number): string {
  const km = metres / 1000;
  return km < 1 ? `${Math.round(metres)} m` : `${km.toFixed(1)} km`;
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function daysSince(dateStr?: string): number {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function digitsOnly(value?: string) {
  return (value || "").replace(/[^0-9]/g, "");
}

// ─── DonorMatchPanel ─────────────────────────────────────────────────────────

function DonorMatchPanel({ requestId, requestBloodGroup, viewerRole }: { requestId: string; requestBloodGroup: string; viewerRole: string }) {
  const [donors, setDonors] = useState<MatchedDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("distance");

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/requests/${requestId}/matches`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setDonors(data.data ?? []);
      else toast.error(data.message ?? "Failed to load matching donors.");
    } catch {
      toast.error("Network error loading donors.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const sorted = [...donors].sort((a, b) => {
    if (sortBy === "distance") return a.distanceMetres - b.distanceMetres;
    if (sortBy === "rating") return (b.trustRating ?? 0) - (a.trustRating ?? 0);
    if (sortBy === "active") return Number(b.availability) - Number(a.availability);
    // lastDonation — longer ago = more eligible
    return daysSince(b.lastDonationDate) - daysSince(a.lastDonationDate);
  });

  const availableCount = donors.filter((d) => d.availability).length;

  return (
    <div style={{ padding: "16px 0 4px", animation: "match-in 0.25s ease-out both" }}>
      <style>{`@keyframes match-in { from { opacity:0; max-height:0; } to { opacity:1; max-height:2000px; } }`}</style>

      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#b71c1c", fontVariationSettings: "'FILL' 1" }}>
            people
          </span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1c1d" }}>
            {loading ? "Finding donors..." : `${donors.length} matching donor${donors.length !== 1 ? "s" : ""}`}
          </span>
          {!loading && availableCount > 0 && (
            <span style={{ background: "#dcfce7", color: "#15803d", fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 20 }}>
              {availableCount} available
            </span>
          )}
        </div>
        <button onClick={fetchMatches} disabled={loading} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: "#b71c1c", fontWeight: 600, fontSize: 12 }}>
          <span className={`material-symbols-outlined ${loading ? "animate-spin" : ""}`} style={{ fontSize: 16 }}>refresh</span>
        </button>
      </div>

      {/* Sort tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
        {([
          { key: "distance", label: "Nearest", icon: "near_me" },
          { key: "active", label: "Available", icon: "check_circle" },
          { key: "lastDonation", label: "Eligible", icon: "event_available" },
          { key: "rating", label: "Top Rated", icon: "star" },
        ] as { key: SortKey; label: string; icon: string }[]).map((s) => (
          <button
            key={s.key}
            onClick={() => setSortBy(s.key)}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 12px", borderRadius: 20, border: "none",
              background: sortBy === s.key ? "#b71c1c" : "#f5f5f5",
              color: sortBy === s.key ? "#fff" : "#666",
              fontWeight: 700, fontSize: 11, cursor: "pointer",
              transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "#f5f5f5", borderRadius: 14, height: 72, animation: "pulse 1.5s infinite", animationDelay: `${i * 0.15}s` }} />
          ))}
          <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>
        </div>
      ) : donors.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 16px", background: "#f9f9f9", borderRadius: 14 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: "#ccc", display: "block", marginBottom: 8 }}>person_search</span>
          <p style={{ fontWeight: 600, fontSize: 14, color: "#888", margin: 0 }}>No matching donors found nearby</p>
          <p style={{ fontSize: 12, color: "#bbb", margin: "4px 0 0" }}>The search radius will auto-expand over time</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((donor) => {
            const eligible = daysSince(donor.lastDonationDate) >= 90;
            const stars = Math.round(donor.trustRating ?? 0);
            return (
              <div
                key={donor._id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "#fff", borderRadius: 14, padding: "12px 14px",
                  border: `1px solid ${donor.availability ? "#dcfce7" : "#f0f0f0"}`,
                  transition: "all 0.15s",
                }}
              >
                {/* Blood group badge */}
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: requestBloodGroup === donor.bloodGroup ? "#b71c1c" : "#7c3aed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0,
                  opacity: donor.availability ? 1 : 0.5,
                }}>
                  {donor.bloodGroup}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1c1d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {donor.name}
                    </span>
                    {/* Online/availability dot */}
                    <span style={{
                      width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                      background: donor.availability ? "#22c55e" : "#d1d5db",
                    }} />
                    {donor.availability && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#15803d" }}>Available</span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {/* Distance */}
                    <span style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 2 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>near_me</span>
                      {fmtDist(donor.distanceMetres)}
                    </span>

                    {/* Stars */}
                    <span style={{ fontSize: 11, color: "#888", display: "flex", alignItems: "center", gap: 1 }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} style={{ color: i <= stars ? "#f59e0b" : "#e5e7eb", fontSize: 11 }}>★</span>
                      ))}
                      <span style={{ marginLeft: 2 }}>{(donor.trustRating ?? 0).toFixed(1)}</span>
                    </span>

                    {/* Donations */}
                    <span style={{ fontSize: 11, color: "#888" }}>
                      {donor.totalDonations ?? 0} donations
                    </span>

                    {/* Last donation / eligibility */}
                    {donor.lastDonationDate && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8,
                        background: eligible ? "#dcfce7" : "#fef3c7",
                        color: eligible ? "#15803d" : "#92400e",
                      }}>
                        {eligible ? "Eligible" : `${90 - daysSince(donor.lastDonationDate)}d cooldown`}
                      </span>
                    )}
                    {!donor.lastDonationDate && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 8, background: "#dbeafe", color: "#1d4ed8" }}>
                        First time
                      </span>
                    )}
                  </div>

                  {/* One-Tap Contact (only visible to hospitals/requesters and admins) */}
                  {['requester', 'admin'].includes((viewerRole || '').toString()) && donor.contactNumber && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <a
                        href={`tel:${donor.contactNumber}`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "6px 12px", borderRadius: 20, border: "none",
                          background: "#dcfce7", color: "#15803d",
                          fontWeight: 700, fontSize: 11, cursor: "pointer",
                          textDecoration: "none",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>call</span>
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${donor.contactNumber.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "6px 12px", borderRadius: 20, border: "none",
                          background: "#d1fae5", color: "#047857",
                          fontWeight: 700, fontSize: 11, cursor: "pointer",
                          textDecoration: "none",
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="#047857"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.932 1.395 5.608L.05 23.708a.6.6 0 00.735.728l5.956-1.554A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6c-1.876 0-3.654-.52-5.192-1.488l-.372-.228-3.857 1.007 1.027-3.752-.25-.395A9.552 9.552 0 012.4 12c0-5.302 4.298-9.6 9.6-9.6s9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6z"/></svg>
                        WhatsApp
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(donor.contactNumber!);
                          toast.success("Number copied!");
                        }}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "6px 12px", borderRadius: 20, border: "none",
                          background: "#f0f0f0", color: "#666",
                          fontWeight: 700, fontSize: 11, cursor: "pointer",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>content_copy</span>
                        Copy
                      </button>
                      </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── RequestsPage ────────────────────────────────────────────────────────────

const RequestsPage = ({ user }: RequestsPageProps) => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [bloodFilter, setBloodFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [compatibleOnly, setCompatibleOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  useEffect(() => { fetchRequests(); }, []);

  const handleAccept = async (requestId: string) => {
    try {
      const res = await fetch("/api/v1/donations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Failed to accept."); return; }
      toast.success("Request accepted! Thank you for donating.");
      fetchRequests();
    } catch {
      toast.error("Network error.");
    }
  };

  const filtered = requests.filter((r) => {
    if (bloodFilter && r.bloodGroup !== bloodFilter) return false;
    if (urgencyFilter && r.urgency !== urgencyFilter) return false;
    if (compatibleOnly && user.role === "donor" && user.bloodGroup) {
      if (!canDonateTo(user.bloodGroup, r.bloodGroup)) return false;
    }
    return true;
  });

  const isMyRequest = (req: BloodRequest) => {
    if (!req.requesterid) return false;
    if (typeof req.requesterid === "object") {
      const rid = (req.requesterid as any)?._id ?? (req.requesterid as any);
      return String(rid) === String(user._id);
    }
    return String(req.requesterid) === String(user._id);
  };

  return (
    <main className="pb-24">
      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 50%, #e53935 100%)",
          padding: "24px 20px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <h1 style={{ color: "#fff", fontWeight: 800, fontSize: 26, margin: 0 }}>Blood Requests</h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 4 }}>
            {filtered.length} active request{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ position: "absolute", right: -40, bottom: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      </section>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginTop: -16, position: "relative", zIndex: 2, overflowX: "auto", paddingBottom: 4, flexWrap: "wrap" }}>
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            style={{
              background: "#fff", border: "none", borderRadius: 14, padding: "10px 14px",
              fontWeight: 600, fontSize: 13, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              outline: "none", cursor: "pointer",
            }}
          >
            <option value="">All Blood Groups</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            style={{
              background: "#fff", border: "none", borderRadius: 14, padding: "10px 14px",
              fontWeight: 600, fontSize: 13, boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              outline: "none", cursor: "pointer",
            }}
          >
            <option value="">All Urgency</option>
            <option value="critical">Emergency</option>
            <option value="high">High</option>
            <option value="medium">Urgent</option>
            <option value="low">Normal</option>
          </select>
          {user.role === "donor" && user.bloodGroup && (
            <button
              onClick={() => setCompatibleOnly(!compatibleOnly)}
              style={{
                padding: "10px 16px", borderRadius: 14, border: "none",
                background: compatibleOnly ? "#b71c1c" : "#fff",
                color: compatibleOnly ? "#fff" : "#666",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              {compatibleOnly ? `Compatible (${user.bloodGroup})` : "Show Compatible"}
            </button>
          )}
        </div>

        {/* Request cards */}
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40, color: "#b71c1c" }}>progress_activity</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 20, padding: "48px 24px", textAlign: "center" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#ddd", display: "block", marginBottom: 12 }}>inbox</span>
              <p style={{ fontWeight: 600, fontSize: 15, color: "#888", margin: 0 }}>No requests found</p>
            </div>
          ) : (
            filtered.map((req) => {
              const urg = URGENCY_CONFIG[req.urgency] ?? URGENCY_CONFIG.low;
              const isOwn = isMyRequest(req);
              const isExpanded = expandedId === req._id;
              const isCompatible = user.role === "donor" && user.bloodGroup ? canDonateTo(user.bloodGroup, req.bloodGroup) : false;

              return (
                <div
                  key={req._id}
                  style={{
                    background: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                    border: isExpanded ? "2px solid #b71c1c" : "1px solid #f0f0f0",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Card header */}
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      {/* Blood group big badge */}
                      <div style={{
                        width: 56, height: 56, borderRadius: 16, flexShrink: 0,
                        background: urg.color, display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 4px 12px ${urg.color}33`,
                      }}>
                        <span style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>{req.bloodGroup}</span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1c1d" }}>{req.patientName}</span>
                          {/* Urgency badge */}
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            background: urg.bg, color: urg.color,
                            padding: "2px 8px", borderRadius: 20,
                            fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5,
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 12, fontVariationSettings: "'FILL' 1" }}>{urg.icon}</span>
                            {urg.label}
                          </span>
                          {isCompatible && (
                            <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 20, fontWeight: 700, fontSize: 10 }}>
                              Compatible
                            </span>
                          )}
                          {/* Status */}
                          <span style={{
                            padding: "2px 8px", borderRadius: 20, fontWeight: 700, fontSize: 10, textTransform: "uppercase",
                            background: req.status === "pending" ? "#fef3c7" : req.status === "accepted" ? "#dbeafe" : req.status === "fulfilled" ? "#dcfce7" : "#f5f5f5",
                            color: req.status === "pending" ? "#92400e" : req.status === "accepted" ? "#1d4ed8" : req.status === "fulfilled" ? "#15803d" : "#888",
                          }}>
                            {req.status}
                          </span>
                        </div>

                        {/* Details row */}
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "#888" }}>
                          {req.hospitalName && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
                              {req.hospitalName}
                            </span>
                          )}
                          {(req.location?.city || req.location?.address) && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                              {req.location.city || req.location.address}
                            </span>
                          )}
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>bloodtype</span>
                            {req.unitsRequired} unit{req.unitsRequired > 1 ? "s" : ""}
                          </span>
                          {req.requiredDate && (
                            <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event</span>
                              {fmtDate(req.requiredDate)}
                            </span>
                          )}
                        </div>

                        {req.contactNumber && (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                            <a
                              href={`tel:${req.contactNumber}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "7px 12px", borderRadius: 20, border: "none",
                                background: "#dcfce7", color: "#15803d",
                                fontWeight: 700, fontSize: 11, cursor: "pointer",
                                textDecoration: "none",
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>
                                call
                              </span>
                              Call
                            </a>
                            <a
                              href={`https://wa.me/${digitsOnly(req.contactNumber)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "7px 12px", borderRadius: 20, border: "none",
                                background: "#d1fae5", color: "#047857",
                                fontWeight: 700, fontSize: 11, cursor: "pointer",
                                textDecoration: "none",
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="#047857" aria-hidden="true">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.932 1.395 5.608L.05 23.708a.6.6 0 00.735.728l5.956-1.554A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6c-1.876 0-3.654-.52-5.192-1.488l-.372-.228-3.857 1.007 1.027-3.752-.25-.395A9.552 9.552 0 012.4 12c0-5.302 4.298-9.6 9.6-9.6s9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6z"/>
                              </svg>
                              WhatsApp
                            </a>
                          </div>
                        )}

                        <div style={{ fontSize: 11, color: "#bbb", marginTop: 6 }}>
                          Posted {timeAgo(req.createdAt)}
                          {req.requesterid && typeof req.requesterid === "object" && (req.requesterid as any).name && !isOwn && (
                            <> by <b style={{ color: "#999" }}>{(req.requesterid as any).name}</b></>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                      {/* Donor: Help Now button */}
                      {user.role === "donor" && req.status === "pending" && (
                        <button
                          onClick={() => handleAccept(req._id)}
                          style={{
                            flex: 1, padding: "11px 0", borderRadius: 14, border: "none",
                            background: "linear-gradient(135deg, #b71c1c, #e53935)",
                            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            boxShadow: "0 4px 12px rgba(183,28,28,0.25)",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>favorite</span>
                          Help Now
                        </button>
                      )}

                      {/* Requester: Show matching donors */}
                      {isOwn && req.status === "pending" && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : req._id)}
                          style={{
                            flex: 1, padding: "11px 0", borderRadius: 14, border: "none",
                            background: isExpanded ? "#b71c1c" : "#f5f5f5",
                            color: isExpanded ? "#fff" : "#b71c1c",
                            fontWeight: 700, fontSize: 13, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                            transition: "all 0.2s",
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                            {isExpanded ? "expand_less" : "people"}
                          </span>
                          {isExpanded ? "Hide Donors" : "Find Matching Donors"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded: Matching donors panel */}
                  {isExpanded && isOwn && (
                    <div style={{ borderTop: "1px solid #f0f0f0", padding: "0 18px 16px", background: "#fafafa" }}>
                      <DonorMatchPanel requestId={req._id} requestBloodGroup={req.bloodGroup} viewerRole={user.role} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
};

export default RequestsPage;
