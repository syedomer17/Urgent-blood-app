import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import type {
  BloodRequest,
  DonationHistoryItem,
  DonorLeaderboardEntry,
  NotificationItem,
  User,
} from "../../types";
import { canDonateTo } from "../../utils/bloodCompatibility";
import StatsGrid from "../../components/dashboard/StatsGrid";
import QuickActions from "../../components/dashboard/QuickActions";
import RequestCard from "../../components/dashboard/RequestCard";

interface DashboardPageProps {
  user: User;
  refetch: () => void;
}

const DONATION_GOALS = [1, 5, 10, 25];

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getAge(dateOfBirth?: string) {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;
  const diff = Date.now() - birthDate.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function addDays(value: string | undefined, days: number) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + days);
  return date;
}

function toReminderInput(value?: string) {
  return value ? value.slice(0, 16) : "";
}

const DashboardPage = ({ user, refetch }: DashboardPageProps) => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [history, setHistory] = useState<DonationHistoryItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<DonorLeaderboardEntry[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderAt, setReminderAt] = useState(toReminderInput(user.nextReminderAt));
  const [reminderEnabled, setReminderEnabled] = useState(Boolean(user.reminderEnabled));

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

  const fetchDonorData = async () => {
    setLoading(true);
    try {
      const [historyRes, leaderboardRes, notificationsRes] = await Promise.all([
        fetch("/api/v1/donations/history", { credentials: "include" }),
        fetch("/api/v1/donations/leaderboard", { credentials: "include" }),
        fetch("/api/v1/notifications", { credentials: "include" }),
      ]);

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.data ?? []);
      }

      if (leaderboardRes.ok) {
        const data = await leaderboardRes.json();
        setLeaderboard(data.data ?? []);
      }

      if (notificationsRes.ok) {
        const data = await notificationsRes.json();
        setNotifications(data.data ?? []);
      }
    } catch {
      toast.error("Failed to load donor dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchDonorData();
  }, []);

  useEffect(() => {
    setReminderAt(toReminderInput(user.nextReminderAt));
    setReminderEnabled(Boolean(user.reminderEnabled));
  }, [user.nextReminderAt, user.reminderEnabled]);

  const toggleAvailability = async () => {
    await fetch("/api/v1/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ availability: !user.availability }),
    });
    refetch();
  };

  const saveReminder = async () => {
    setSavingReminder(true);
    try {
      const res = await fetch("/api/v1/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nextReminderAt: reminderAt || null,
          reminderEnabled,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || "Failed to save reminder settings.");
        return;
      }

      toast.success("Reminder preferences saved.");
      refetch();
      fetchDonorData();
    } catch {
      toast.error("Network error.");
    } finally {
      setSavingReminder(false);
    }
  };

  const handleDownloadCertificate = (item: DonationHistoryItem) => {
    const request = typeof item.requestId === "string" ? null : item.requestId;
    const certificateHtml = `
      <html>
        <head>
          <title>Donation Certificate</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #1a1c1d; }
            .card { border: 2px solid #b71c1c; border-radius: 24px; padding: 32px; }
            .eyebrow { text-transform: uppercase; letter-spacing: 0.2em; font-size: 12px; color: #b71c1c; font-weight: 700; }
            h1 { font-size: 32px; margin: 12px 0 8px; }
            p { line-height: 1.6; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }
            .meta { background: #faf6f6; border-radius: 16px; padding: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="eyebrow">Donation Certificate</div>
            <h1>${user.name}</h1>
            <p>This confirms the successful blood donation recorded on ${formatDate(item.donationDate)}.</p>
            <div class="grid">
              <div class="meta"><strong>Blood Group</strong><br/>${user.bloodGroup ?? "N/A"}</div>
              <div class="meta"><strong>Units Donated</strong><br/>${item.unitsDonated}</div>
              <div class="meta"><strong>Hospital</strong><br/>${request?.hospitalName ?? "LifeLink Blood Network"}</div>
              <div class="meta"><strong>Patient</strong><br/>${request?.patientName ?? "Confidential"}</div>
            </div>
            <p style="margin-top:24px;">Thank you for helping save lives.</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([certificateHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `donation-certificate-${item._id}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      fetchDonorData();
    } catch {
      toast.error("Could not update notification.");
    }
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const compatibleRequests =
    user.role === "donor" && user.bloodGroup
      ? pendingRequests.filter((r) => canDonateTo(user.bloodGroup!, r.bloodGroup))
      : pendingRequests;
  const incompatibleRequests =
    user.role === "donor" && user.bloodGroup
      ? pendingRequests.filter((r) => !canDonateTo(user.bloodGroup!, r.bloodGroup))
      : [];

  const completedDonations = history.filter((item) => item.status === "completed");
  const latestDonation = completedDonations[0] ?? null;
  const nextEligibleDate = addDays(user.lastDonationDate ?? latestDonation?.donationDate, 90);
  const age = getAge(user.dateOfBirth);
  const totalDonations = user.totalDonations ?? completedDonations.length;
  const nextGoal = DONATION_GOALS.find((goal) => goal > totalDonations) ?? null;
  const goalProgress = nextGoal ? Math.min((totalDonations / nextGoal) * 100, 100) : 100;

  const healthWarnings: string[] = [];
  if (!user.bloodGroup) healthWarnings.push("Add your blood group to unlock matching requests.");
  if (age !== null && (age < 18 || age > 65)) healthWarnings.push(`Age ${age} is outside the usual donation window.`);
  if (user.weightKg !== undefined && user.weightKg < 50) healthWarnings.push("Weight is below the usual donation minimum of 50 kg.");
  if (nextEligibleDate && nextEligibleDate.getTime() > Date.now()) {
    healthWarnings.push(`Next eligible donation date is ${formatDate(nextEligibleDate.toISOString())}.`);
  }
  if ((user.medicalConditions ?? []).length > 0) {
    healthWarnings.push(`Medical notes recorded: ${user.medicalConditions?.join(", ")}.`);
  }

  const hospitalCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of completedDonations) {
      const request = typeof item.requestId === "string" ? null : item.requestId;
      const hospital = request?.hospitalName?.trim() || "Community care";
      counts.set(hospital, (counts.get(hospital) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }));
  }, [completedDonations]);

  const recommendedDonationCenter =
    hospitalCounts[0]?.name ||
    (user.location?.city ? `${user.location.city} community blood bank` : "Nearest verified hospital");

  const visibleNotifications = notifications.slice(0, 5);
  const visibleLeaderboard = leaderboard.slice(0, 5);

  return (
    <main className="max-w-6xl mx-auto px-6 space-y-10 pb-20">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] pt-4">
        <div className="rounded-4xl bg-[radial-gradient(circle_at_top_left,rgba(183,28,28,0.18),transparent_45%),linear-gradient(135deg,#fff8f6_0%,#ffffff_58%,#fff3f0_100%)] border border-[#f2d7d3] p-8 shadow-[0_16px_60px_rgba(183,28,28,0.08)] overflow-hidden relative">
          <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-secondary">
              <span className="px-3 py-1 rounded-full bg-white/80 border border-[#f0d5d1]">Donor dashboard</span>
              <span className={`px-3 py-1 rounded-full ${user.availability ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {user.availability ? "Available" : "Unavailable"}
              </span>
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary">
                Trust {user.trustRating?.toFixed(1) ?? "0.0"}/5
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <h2 className="font-headline font-extrabold text-3xl md:text-5xl tracking-tight text-on-surface leading-tight">
                  {user.name}
                </h2>
                <p className="text-secondary text-sm md:text-base max-w-xl">
                  Track your donation history, watch your eligibility status, and keep an eye on requests and rewards in one place.
                </p>
              </div>
              {user.bloodGroup && (
                <div className="rounded-3xl bg-white/80 backdrop-blur px-6 py-4 border border-[#f0d5d1] shadow-sm text-right">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-secondary">Blood Group</p>
                  <p className="font-headline font-black text-5xl text-primary leading-none mt-1">{user.bloodGroup}</p>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/85 border border-[#f2ded9] p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-secondary font-bold">Completed donations</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-on-surface">{completedDonations.length}</span>
                  <span className="text-sm text-secondary font-semibold">records</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/85 border border-[#f2ded9] p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-secondary font-bold">Next goal</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-on-surface">{nextGoal ?? "Max"}</span>
                  <span className="text-sm text-secondary font-semibold">donations</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/85 border border-[#f2ded9] p-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-secondary font-bold">Certificates</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-on-surface">{completedDonations.length}</span>
                  <span className="text-sm text-secondary font-semibold">ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-4xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-secondary">Eligibility</p>
              <h3 className="font-headline font-black text-2xl mt-1">Donation readiness</h3>
            </div>
            <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold text-secondary">
              <span>Progress to next badge</span>
              <span>{totalDonations}/{nextGoal ?? totalDonations}</span>
            </div>
            <div className="h-3 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full rounded-full bg-signature-gradient" style={{ width: `${goalProgress}%` }} />
            </div>
            <p className="text-sm text-secondary">
              {nextGoal ? `You are ${Math.max(nextGoal - totalDonations, 0)} donations away from your next milestone.` : "You are at your highest tracked goal."}
            </p>
          </div>

          <div className="space-y-3">
            {healthWarnings.length > 0 ? (
              healthWarnings.map((warning) => (
                <div key={warning} className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-amber-900 text-sm font-medium">
                  {warning}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-green-50 border border-green-100 px-4 py-3 text-green-800 text-sm font-medium">
                No active eligibility warnings. You look ready to donate.
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm font-semibold text-secondary">
              <span>Reminder</span>
              <span>{reminderEnabled ? "Enabled" : "Disabled"}</span>
            </div>
            <p className="text-sm text-on-surface font-medium">{formatDateTime(user.nextReminderAt)}</p>
            <Link to="/profile" className="inline-flex items-center gap-2 text-primary text-sm font-bold hover:underline">
              Manage reminder settings
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-4 space-y-2">
            <div className="text-[11px] uppercase tracking-[0.2em] text-secondary font-bold">Recommended center</div>
            <p className="text-sm font-semibold text-on-surface">{recommendedDonationCenter}</p>
            <p className="text-sm text-secondary">Based on your donation history and current location.</p>
          </div>
        </aside>
      </section>

      <StatsGrid user={user} />

      <QuickActions user={user} onToggleAvailability={toggleAvailability} />

      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="rounded-4xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-secondary">Health profile</p>
              <h3 className="font-headline font-black text-2xl mt-1">Eligibility details</h3>
            </div>
            <Link to="/profile" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
              Edit profile
              <span className="material-symbols-outlined text-xs">edit</span>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-surface-container-low p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-secondary font-bold">Age</div>
              <div className="mt-2 text-2xl font-black text-on-surface">{age ?? "—"}</div>
              <p className="text-sm text-secondary mt-1">{user.dateOfBirth ? formatDate(user.dateOfBirth) : "Add your date of birth for eligibility checks."}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <div className="text-[11px] uppercase tracking-[0.2em] text-secondary font-bold">Weight</div>
              <div className="mt-2 text-2xl font-black text-on-surface">{user.weightKg ? `${user.weightKg} kg` : "—"}</div>
              <p className="text-sm text-secondary mt-1">The usual minimum for donation is 50 kg.</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4 sm:col-span-2">
              <div className="text-[11px] uppercase tracking-[0.2em] text-secondary font-bold">Medical conditions</div>
              <div className="mt-2 text-sm text-on-surface">
                {(user.medicalConditions ?? []).length > 0 ? user.medicalConditions?.join(", ") : "None recorded"}
              </div>
              <p className="text-sm text-secondary mt-1">Keep this updated so the app can show relevant warnings before donation day.</p>
            </div>
          </div>
        </div>

        <div className="rounded-4xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-secondary">Reminder scheduling</p>
            <h3 className="font-headline font-black text-2xl mt-1">Set your next reminder</h3>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-secondary">Reminder time</span>
            <input
              type="datetime-local"
              value={reminderAt}
              onChange={(e) => setReminderAt(e.target.value)}
              className="w-full bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </label>

          <button
            type="button"
            onClick={() => setReminderEnabled((value) => !value)}
            className={`w-full rounded-xl px-4 py-3 font-bold text-sm transition-colors ${reminderEnabled ? "bg-primary text-white" : "bg-surface-container-low text-secondary"}`}
          >
            {reminderEnabled ? "Reminder enabled" : "Reminder disabled"}
          </button>

          <button
            type="button"
            onClick={saveReminder}
            disabled={savingReminder}
            className="w-full bg-signature-gradient text-white font-bold px-4 py-3 rounded-xl disabled:opacity-60"
          >
            {savingReminder ? "Saving..." : "Save reminder"}
          </button>

          <p className="text-sm text-secondary">
            Saved reminders appear on your profile and help keep your cooldown schedule visible.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-end gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-secondary">Today&apos;s need</p>
            <h2 className="font-headline font-extrabold text-2xl tracking-tight mt-1">Compatible requests</h2>
          </div>
          <Link to="/requests" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
            See all requests
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
        {compatibleRequests.length === 0 && incompatibleRequests.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-secondary/40 mb-2">check_circle</span>
            <p className="text-secondary font-medium">No pending requests right now. Check back later!</p>
          </div>
        ) : (
          <>
            {compatibleRequests.length > 0 && (
              <>
                {user.role === "donor" && user.bloodGroup && (
                  <p className="text-xs font-bold text-primary uppercase tracking-wider ml-1 mb-2">
                    Compatible with your blood group ({user.bloodGroup})
                  </p>
                )}
                <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide -mx-6 px-6">
                  {compatibleRequests.slice(0, 6).map((req) => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      userRole={user.role}
                      onAccepted={fetchRequests}
                    />
                  ))}
                </div>
              </>
            )}
            {incompatibleRequests.length > 0 && (
              <>
                <p className="text-xs font-bold text-secondary uppercase tracking-wider ml-1 mb-2 mt-4">Other requests</p>
                <div className="flex overflow-x-auto pb-6 gap-6 scrollbar-hide -mx-6 px-6 opacity-60">
                  {incompatibleRequests.slice(0, 4).map((req) => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      userRole={user.role}
                      onAccepted={fetchRequests}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-4xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-secondary">Donation history</p>
              <h3 className="font-headline font-black text-2xl mt-1">Certificates and hospitals helped</h3>
            </div>
            <span className="text-sm text-secondary font-semibold">{completedDonations.length} certificate(s)</span>
          </div>

          {completedDonations.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low p-6 text-center text-secondary">
              Your completed donation history will appear here after your first accepted request.
            </div>
          ) : (
            <div className="space-y-4">
              {completedDonations.slice(0, 4).map((item) => {
                const request = typeof item.requestId === "string" ? null : item.requestId;
                return (
                  <div key={item._id} className="rounded-2xl bg-surface-container-low p-5 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-secondary">
                        <span className="px-2 py-1 rounded-full bg-white">{request?.bloodGroup ?? user.bloodGroup ?? "Blood"}</span>
                        <span>{formatDate(item.donationDate)}</span>
                      </div>
                      <h4 className="font-headline font-bold text-lg text-on-surface">
                        {request?.patientName ?? "Completed donation"}
                      </h4>
                      <p className="text-sm text-secondary">
                        {request?.hospitalName ?? "Community care"} · {item.unitsDonated} unit(s)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadCertificate(item)}
                      className="inline-flex items-center gap-2 bg-primary text-white font-bold px-4 py-2.5 rounded-xl shrink-0"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Download certificate
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-3">
            <h4 className="font-bold text-sm uppercase tracking-[0.18em] text-secondary">Hospitals helped</h4>
            {hospitalCounts.length === 0 ? (
              <p className="text-sm text-secondary">No hospital records yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {hospitalCounts.slice(0, 4).map((hospital) => (
                  <div key={hospital.name} className="rounded-2xl bg-white border border-outline-variant/20 p-4">
                    <div className="font-semibold text-on-surface">{hospital.name}</div>
                    <div className="text-sm text-secondary mt-1">Helped {hospital.count} time(s)</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-4xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-secondary">Public leaderboard</p>
              <h3 className="font-headline font-black text-2xl mt-1">Top donors</h3>
            </div>
            <span className="text-sm text-secondary font-semibold">Real-time snapshot</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
          ) : visibleLeaderboard.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-low p-6 text-center text-secondary">
              Leaderboard data will appear once donation history is recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleLeaderboard.map((entry) => (
                <div
                  key={entry.donorId}
                  className={`rounded-2xl p-4 border flex items-center gap-4 ${entry.donorId === user._id ? "bg-primary/5 border-primary/20" : "bg-surface-container-low border-outline-variant/20"}`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <span className="font-headline font-black text-lg text-primary">{entry.rank}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-on-surface truncate">{entry.name}</h4>
                      <span className="text-sm">{entry.badge}</span>
                    </div>
                    <p className="text-sm text-secondary mt-1">
                      {entry.totalUnits} units · {entry.completedDonations} donations · {entry.bloodGroup ?? "Blood group hidden"}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${entry.availability ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {entry.availability ? "Available" : "Away"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-4xl bg-surface-container-lowest border border-outline-variant/20 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.04)] space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-secondary">Emergency inbox</p>
            <h3 className="font-headline font-black text-2xl mt-1">Live alerts and messages</h3>
          </div>
          <Link to="/requester/donors-near-me" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
            Open donor map
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>

        {visibleNotifications.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-low p-6 text-center text-secondary">
            No new alerts. Emergency and request notifications will appear here.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleNotifications.map((notification) => (
              <div key={notification._id} className={`rounded-2xl p-4 border ${notification.isRead ? "bg-surface-container-low border-outline-variant/20" : "bg-primary/5 border-primary/10"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-on-surface">{notification.title}</h4>
                    <p className="text-sm text-secondary mt-1">{notification.message}</p>
                  </div>
                  {!notification.isRead && (
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">New</span>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-secondary font-semibold">
                  <span>{formatDate(notification.createdAt)}</span>
                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(notification._id)}
                      className="text-primary font-bold hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;