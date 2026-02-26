import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestApi } from '../services/api';

interface Donation {
  _id: string;
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  urgency: string;
  status: string;
  createdAt: string;
  requesterid?: { name: string };
}

export const DonationsPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    requestApi.getAll().then((res) => {
      if (res.success && res.data) {
        setDonations((res.data as any[]).filter((r) => r.status === 'accepted' || r.status === 'fulfilled'));
      }
    }).catch(() => { }).finally(() => setIsLoading(false));
  }, [authLoading, user]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f7' }}>
        <div className="w-10 h-10 rounded-full border-4 border-red-100 border-t-red-500 animate-spin" />
      </div>
    );
  }

  const totalUnits = donations.reduce((s, d) => s + (d.unitsRequired || 1), 0);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f5f5f7' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-5"
        style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}
      >
        <h1 className="text-white text-xl font-extrabold">My Donations</h1>
        <p className="text-red-100 text-xs mt-0.5">Your life-saving history</p>

        {/* Mini stats */}
        <div className="flex gap-3 mt-5">
          {[
            { label: 'Donations', value: donations.length },
            { label: 'Units Given', value: totalUnits },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 rounded-2xl py-3 px-4 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <p className="text-white text-xl font-black">{value}</p>
              <p className="text-red-100 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 max-w-sm mx-auto">
        {donations.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p className="text-5xl mb-3">💉</p>
            <p className="text-gray-600 font-semibold mb-1 text-sm">No donations yet</p>
            <p className="text-gray-400 text-xs mb-5">Browse requests to start making a difference</p>
            <button
              onClick={() => window.location.href = '/requests'}
              className="px-6 py-3 rounded-2xl text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
            >
              View Requests
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {donations.map((d) => (
              <div key={d._id} className="bg-white rounded-2xl p-4 flex gap-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0" style={{ background: '#fef2f2' }}>
                  <span className="text-red-600 font-black text-sm leading-none">{d.bloodGroup}</span>
                  <span className="text-red-400 text-xs">{d.unitsRequired}u</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-gray-900 text-sm truncate">{d.patientName || 'Unknown patient'}</p>
                    <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${d.status === 'fulfilled' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                      {d.status === 'fulfilled' ? '✓ Done' : '● Active'}
                    </span>
                  </div>
                  {d.requesterid && <p className="text-xs text-gray-400">By {d.requesterid.name}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">📅 {new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
