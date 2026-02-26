import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestApi } from '../services/api';

interface Stats {
  activeRequests: number;
  donationsCount: number;
  totalUnits: number;
  rating: number;
}

export const HomePage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({ activeRequests: 0, donationsCount: 0, totalUnits: 0, rating: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const fetchStats = async () => {
      try {
        const response = await requestApi.getAll();
        if (response.success && response.data) {
          const all = response.data as any[];
          const activeRequests = all.filter((r) => r.status === 'pending').length;
          const done = all.filter((r) => r.status === 'accepted' || r.status === 'fulfilled');
          const totalUnits = done.reduce((s, r) => s + (r.unitsRequired || 1), 0);
          setStats({ activeRequests, donationsCount: done.length, totalUnits, rating: user?.rating || 0 });
        }
      } catch { }
      finally { setIsLoading(false); }
    };
    fetchStats();
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#fafafa' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-red-100 border-t-red-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) { window.location.href = '/login'; return null; }

  const firstName = user.name.split(' ')[0];
  const isDonor = user.role === 'donor';

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f5f5f7' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}
      >
        {/* bg circle */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10" style={{ background: '#fff' }} />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-red-200 text-sm font-medium mb-0.5">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},</p>
            <h1 className="text-white text-2xl font-extrabold tracking-tight">{firstName} 👋</h1>
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
              {isDonor ? '🩸 Blood Donor' : '🏥 Requester'}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <span className="text-white text-2xl font-black">{firstName.charAt(0)}</span>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { value: stats.activeRequests, label: 'Active' },
            { value: stats.donationsCount, label: 'Donations' },
            { value: stats.totalUnits, label: 'Units' },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="rounded-2xl py-3 px-2 text-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <p className="text-white text-xl font-black leading-none">{value}</p>
              <p className="text-red-100 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-5 max-w-sm mx-auto">
        {/* Quick action primary */}
        {isDonor ? (
          <button
            onClick={() => window.location.href = '/update-availability'}
            className="w-full flex items-center gap-4 p-5 rounded-3xl text-white text-left transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', boxShadow: '0 10px 30px rgba(231,76,60,0.35)' }}
          >
            <span className="text-4xl shrink-0">🩸</span>
            <div>
              <p className="font-bold text-base">Update Availability</p>
              <p className="text-red-100 text-xs mt-0.5">Tell donors if you're ready to give</p>
            </div>
            <svg className="ml-auto shrink-0 w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => window.location.href = '/request'}
            className="w-full flex items-center gap-4 p-5 rounded-3xl text-white text-left transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', boxShadow: '0 10px 30px rgba(231,76,60,0.35)' }}
          >
            <span className="text-4xl shrink-0">🆘</span>
            <div>
              <p className="font-bold text-base">Request Blood Now</p>
              <p className="text-red-100 text-xs mt-0.5">Find matching donors near you</p>
            </div>
            <svg className="ml-auto shrink-0 w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Section label */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Explore</p>
          <div className="space-y-2.5">
            {[
              { icon: '📋', label: 'View All Blood Requests', sub: 'See requests in your area', href: '/requests' },
              { icon: '🏥', label: 'Browse Donors', sub: 'Find compatible donors', href: '/donors' },
              { icon: '💉', label: 'My Donations', sub: 'Your donation history', href: '/donations' },
            ].map(({ icon, label, sub, href }) => (
              <button
                key={href}
                onClick={() => window.location.href = href}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left bg-white border border-gray-100 active:scale-[0.98] transition-all"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                <span className="text-2xl shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
                <svg className="shrink-0 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Your Info</p>
          <div className="space-y-2.5">
            {[
              { label: 'Blood Group', value: user.bloodGroup || '—', highlight: true },
              { label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1), highlight: false },
              { label: 'Status', value: user.availability ? '✅ Available' : '⏸ Unavailable', highlight: false },
              { label: 'Rating', value: `⭐ ${(user.rating || 0).toFixed(1)}`, highlight: false },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{label}</span>
                <span className={`text-sm font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
