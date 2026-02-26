import React, { useEffect, useState, useCallback } from 'react';
import { adminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── Types ──────────────────────────────────────────────────── */
interface BloodGroupDistribution {
  _id: string;
  count: number;
}

interface AdminStats {
  totalDonors: number;
  activeRequests: number;
  completedDonations: number;
  bloodGroupDistribution: BloodGroupDistribution[];
  averageResponseTimeMinutes: string;
}

/* ─── Blood‐group colour palette ─────────────────────────────── */
const BG_COLOURS: Record<string, string> = {
  'O+': '#e74c3c',
  'O-': '#c0392b',
  'A+': '#e67e22',
  'A-': '#d35400',
  'B+': '#8e44ad',
  'B-': '#6c3483',
  'AB+': '#2980b9',
  'AB-': '#1a5276',
};

const bgColour = (id: string) => BG_COLOURS[id] ?? '#e74c3c';

/* ─── Skeleton block ──────────────────────────────────────────── */
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 rounded-2xl ${className}`} />
);

/* ─── Stat card ───────────────────────────────────────────────── */
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;   // tailwind bg colour class for the icon ring
  sub?: string;
}
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, accent, sub }) => (
  <div
    className="bg-white rounded-2xl p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform"
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
  >
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-base shrink-0 ${accent}`}
    >
      {icon}
    </div>
    <div>
      <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

/* ─── Loading skeleton layout ────────────────────────────────── */
const LoadingSkeleton: React.FC = () => (
  <div className="min-h-screen pb-28" style={{ background: '#f5f5f7' }}>
    {/* Hero skeleton */}
    <div className="px-5 pt-12 pb-8" style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}>
      <Skeleton className="w-32 h-4 bg-red-400 mb-2" />
      <Skeleton className="w-48 h-7 bg-red-400 mb-5" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-14 bg-red-400 opacity-60" />)}
      </div>
    </div>
    {/* Cards skeleton */}
    <div className="px-4 pt-5 max-w-sm mx-auto space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-56 w-full" />
    </div>
  </div>
);

/* ─── Error state ─────────────────────────────────────────────── */
const ErrorState: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="min-h-screen pb-28 flex flex-col items-center justify-center px-6" style={{ background: '#f5f5f7' }}>
    <div
      className="w-full max-w-sm bg-white rounded-3xl p-8 flex flex-col items-center text-center"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
    >
      <span className="text-5xl mb-4">🚨</span>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Couldn't load data</h2>
      <p className="text-sm text-gray-500 mb-6">There was a problem fetching the admin statistics. Check your connection and try again.</p>
      <button
        onClick={onRetry}
        className="w-full py-3 rounded-2xl font-bold text-white text-sm active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', boxShadow: '0 6px 20px rgba(231,76,60,0.35)' }}
      >
        Try Again
      </button>
    </div>
  </div>
);

/* ─── Main component ─────────────────────────────────────────── */
export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [barsVisible, setBarsVisible] = useState(false);

  const fetchStats = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true);
      else { setIsLoading(true); setHasError(false); }

      setBarsVisible(false);
      const response = await adminApi.getStats();
      if (response.success && response.data) {
        setStats(response.data as AdminStats);
        setLastUpdated(new Date());
        setHasError(false);
        // Animate bars after paint
        setTimeout(() => setBarsVisible(true), 80);
      }
    } catch (err: any) {
      setHasError(true);
      if (showRefresh) toast.error('Failed to refresh statistics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (isLoading) return <LoadingSkeleton />;
  if (hasError || !stats) return <ErrorState onRetry={() => fetchStats()} />;

  const maxCount = Math.max(...stats.bloodGroupDistribution.map(g => g.count), 1);
  const totalInDistribution = stats.bloodGroupDistribution.reduce((s, g) => s + g.count, 0);
  const firstName = user?.name?.split(' ')[0] ?? 'Admin';

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const avgMins = parseFloat(stats.averageResponseTimeMinutes);
  const avgDisplay = avgMins >= 60
    ? `${(avgMins / 60).toFixed(1)}h`
    : `${Math.round(avgMins)}m`;

  return (
    <div className="min-h-screen pb-28" style={{ background: '#f5f5f7' }}>

      {/* ── Hero header ── */}
      <div
        className="px-5 pt-12 pb-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}
      >
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10 bg-white" />
        <div className="absolute top-20 -left-8 w-24 h-24 rounded-full opacity-5 bg-white" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-200 text-xs font-semibold mb-0.5 tracking-wide uppercase">
                Welcome back,
              </p>
              <h1 className="text-white text-2xl font-black tracking-tight">
                {firstName} 👋
              </h1>
              <span
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
              >
                🛡️ Admin Control
              </span>
            </div>

            {/* Refresh area */}
            <div className="flex flex-col items-end gap-1.5">
              <button
                onClick={() => fetchStats(true)}
                disabled={isRefreshing}
                className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform disabled:opacity-60"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <svg
                  className={`w-5 h-5 text-white ${isRefreshing ? 'animate-spin' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              {lastUpdated && (
                <p className="text-[10px] text-red-200">{formatTime(lastUpdated)}</p>
              )}
            </div>
          </div>

          {/* Two hero stats */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div
              className="rounded-2xl py-4 px-4 text-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <p className="text-white text-2xl font-black leading-none">
                {stats.totalDonors.toLocaleString()}
              </p>
              <p className="text-red-100 text-xs mt-1">Total Donors</p>
            </div>
            <div
              className="rounded-2xl py-4 px-4 text-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <p className="text-white text-2xl font-black leading-none">
                {stats.activeRequests.toLocaleString()}
              </p>
              <p className="text-red-100 text-xs mt-1">Active Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="px-4 pt-5 space-y-5 max-w-sm mx-auto">

        {/* Stat cards 2×2 */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Overview
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              label="Total Donors"
              value={stats.totalDonors.toLocaleString()}
              accent="bg-blue-500"
            />
            <StatCard
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Active Requests"
              value={stats.activeRequests.toLocaleString()}
              accent="bg-amber-500"
              sub="pending + accepted"
            />
            <StatCard
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Completed"
              value={stats.completedDonations.toLocaleString()}
              accent="bg-emerald-500"
              sub="donations done"
            />
            <StatCard
              icon={
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              label="Avg Response"
              value={avgDisplay}
              accent="bg-violet-500"
              sub="request → donation"
            />
          </div>
        </div>

        {/* Blood group distribution */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Blood Group Distribution
          </p>
          <div
            className="bg-white rounded-3xl p-5"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
          >
            <div className="space-y-3.5">
              {stats.bloodGroupDistribution.map((group) => {
                const pct = (group.count / maxCount) * 100;
                const colour = bgColour(group._id);
                return (
                  <div key={group._id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
                          style={{ background: colour }}
                        >
                          {group._id}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">
                          {group.count.toLocaleString()}
                          <span className="text-xs font-normal text-gray-400 ml-1">donors</span>
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 font-medium">
                        {totalInDistribution > 0
                          ? `${((group.count / totalInDistribution) * 100).toFixed(1)}%`
                          : '0%'}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: barsVisible ? `${pct}%` : '0%',
                          background: colour,
                          transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div
              className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between"
            >
              <p className="text-xs text-gray-500">
                <span className="font-bold text-gray-700">{totalInDistribution.toLocaleString()}</span>
                {' '}total across all groups
              </p>
              <span
                className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background: 'rgba(231,76,60,0.1)', color: '#e74c3c' }}
              >
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* System info card */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            System
          </p>
          <div
            className="bg-white rounded-3xl p-5 space-y-3"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
          >
            {[
              {
                label: 'Avg Response Time',
                value: `${parseFloat(stats.averageResponseTimeMinutes).toFixed(1)} min`,
                icon: '⏱',
              },
              {
                label: 'Completion Rate',
                value: stats.totalDonors > 0
                  ? `${((stats.completedDonations / stats.totalDonors) * 100).toFixed(1)}%`
                  : '—',
                icon: '📈',
              },
              {
                label: 'Active vs Completed',
                value: `${stats.activeRequests} / ${stats.completedDonations}`,
                icon: '📊',
              },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchStats(true)}
          disabled={isRefreshing}
          className="w-full py-4 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
            boxShadow: '0 8px 24px rgba(231,76,60,0.3)',
          }}
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {isRefreshing ? 'Refreshing…' : 'Refresh Stats'}
        </button>
      </div>
    </div>
  );
};
