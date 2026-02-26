import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiCall } from '../services/api';

interface Donor {
  _id: string;
  name: string;
  bloodGroup: string;
  availability: boolean;
  trustRating?: number;
  totalDonations?: number;
  location?: { city?: string; state?: string; address?: string };
  contactNumber: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const DonorsPage: React.FC = () => {
  const { isLoading: authLoading } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filterBlood, setFilterBlood] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    apiCall<any>('/users')
      .then((res) => {
        if (res.success && res.data) {
          setDonors((res.data as any[]).filter((u) => u.role === 'donor').sort((a: any, b: any) => (b.trustRating || 0) - (a.trustRating || 0)));
        } else {
          setError('Could not load donors.');
        }
      })
      .catch(() => setError('Failed to load donors'))
      .finally(() => setIsLoading(false));
  }, [authLoading]);

  const filtered = donors.filter((d) => {
    if (filterBlood && d.bloodGroup !== filterBlood) return false;
    if (availableOnly && !d.availability) return false;
    return true;
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f7' }}>
        <div className="w-10 h-10 rounded-full border-4 border-red-100 border-t-red-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-24" style={{ background: '#f5f5f7' }}>
        <div className="px-5 pt-12 pb-5" style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}>
          <h1 className="text-white text-xl font-extrabold">Browse Donors</h1>
        </div>
        <div className="px-4 pt-8 text-center max-w-sm mx-auto">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f5f5f7' }}>
      {/* Header + filters */}
      <div
        className="px-5 pt-12 pb-5"
        style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}
      >
        <h1 className="text-white text-xl font-extrabold">Browse Donors</h1>
        <p className="text-red-100 text-xs mt-0.5">{filtered.length} donors found</p>

        {/* Blood group chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setFilterBlood('')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold ${!filterBlood ? 'bg-white text-red-600' : 'text-white'}`}
            style={filterBlood ? { background: 'rgba(255,255,255,0.2)' } : {}}
          >
            All
          </button>
          {BLOOD_GROUPS.map((bg) => (
            <button
              key={bg}
              onClick={() => setFilterBlood(bg === filterBlood ? '' : bg)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold ${filterBlood === bg ? 'bg-white text-red-600' : 'text-white'}`}
              style={filterBlood !== bg ? { background: 'rgba(255,255,255,0.2)' } : {}}
            >
              {bg}
            </button>
          ))}
        </div>

        {/* Available toggle */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setAvailableOnly(!availableOnly)}
            className={`relative w-11 h-6 rounded-full transition-all ${availableOnly ? 'bg-white' : ''}`}
            style={!availableOnly ? { background: 'rgba(255,255,255,0.3)' } : {}}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-all ${availableOnly ? 'translate-x-5 bg-red-600' : 'translate-x-0 bg-white'}`} />
          </button>
          <span className="text-white text-sm font-medium">Available only</span>
        </div>
      </div>

      <div className="px-4 pt-4 max-w-sm mx-auto space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500 text-sm">No donors match your filters</p>
          </div>
        ) : (
          filtered.map((donor) => (
            <div key={donor._id} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div className="flex items-center gap-3">
                {/* Blood badge */}
                <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0" style={{ background: '#fef2f2' }}>
                  <span className="text-red-600 font-black text-base leading-none">{donor.bloodGroup}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-bold text-gray-900 text-sm truncate">{donor.name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${donor.availability ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {donor.availability ? '● Available' : '○ Away'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {donor.location && (
                      <span className="text-xs text-gray-400">
                        📍 {donor.location.city || donor.location.state || donor.location.address || 'Unknown'}
                      </span>
                    )}
                    {donor.trustRating !== undefined && (
                      <span className="text-xs text-gray-400">⭐ {donor.trustRating.toFixed(1)} · {donor.totalDonations || 0} donations</span>
                    )}
                  </div>
                </div>
              </div>

              {donor.contactNumber && (
                <button
                  onClick={() => { navigator.clipboard.writeText(donor.contactNumber); }}
                  className="w-full mt-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-100 active:scale-95 transition-all"
                >
                  📋 Copy {donor.contactNumber}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
