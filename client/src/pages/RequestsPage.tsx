import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestApi, donationApi, userApi } from '../services/api';
import DonorMapView from '../components/DonorMapView';
import type { DonorMapItem, RequestMapItem } from '../components/DonorMapView';

interface Request {
  _id: string;
  requesterid: any;
  patientName: string;
  bloodGroup: string;
  unitsRequired: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'accepted' | 'fulfilled' | 'cancelled';
  notes?: string;
  location: any;
  createdAt: string;
}

const URGENCY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: '#fef2f2', text: '#dc2626', label: '🚨 Critical' },
  high: { bg: '#fff7ed', text: '#ea580c', label: '⚡ High' },
  medium: { bg: '#fefce8', text: '#ca8a04', label: '● Medium' },
  low: { bg: '#eff6ff', text: '#2563eb', label: '● Low' },
};

const FILTERS = ['all', 'pending', 'accepted', 'fulfilled'] as const;

export const RequestsPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  // Map view state
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapDonors, setMapDonors] = useState<DonorMapItem[]>([]);
  const [mapRequests, setMapRequests] = useState<RequestMapItem[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const mapLoaded = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    requestApi.getAll().then((res) => {
      if (res.success && Array.isArray(res.data)) setRequests(res.data as Request[]);
    }).catch(() => { }).finally(() => setIsLoading(false));
  }, [authLoading]);

  // Lazy-load map data only once when user first opens the map tab
  const loadMapData = async () => {
    if (mapLoaded.current) return;
    setMapLoading(true);
    try {
      const [donorsRes, requestsRes] = await Promise.all([
        userApi.getDonors(),
        requestApi.getMapData(),
      ]);
      if (donorsRes.success && Array.isArray(donorsRes.data)) {
        setMapDonors(donorsRes.data as DonorMapItem[]);
      }
      if (requestsRes.success && Array.isArray(requestsRes.data)) {
        setMapRequests(requestsRes.data as RequestMapItem[]);
      }
      mapLoaded.current = true;
    } catch {
      // silently fail — map will show empty state
    } finally {
      setMapLoading(false);
    }
  };

  const switchToMap = () => {
    setViewMode('map');
    loadMapData();
  };

  const handleAccept = async (id: string) => {
    setAcceptingId(id);
    try {
      const res = await donationApi.accept(id);
      if (res.success) setRequests((r) => r.map((x) => x._id === id ? { ...x, status: 'accepted' } : x));
    } finally { setAcceptingId(null); }
  };

  const filtered = requests.filter((r) => filter === 'all' || r.status === filter);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f5f7' }}>
        <div className="w-10 h-10 rounded-full border-4 border-red-100 border-t-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#f5f5f7' }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-5"
        style={{ background: 'linear-gradient(160deg, #c0392b 0%, #e74c3c 100%)' }}
      >
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-white text-xl font-extrabold">Blood Requests</h1>
            <p className="text-red-100 text-xs mt-0.5">
              {viewMode === 'list'
                ? `${requests.length} total · ${filtered.length} showing`
                : `${mapDonors.length} donors · ${mapRequests.length} requests on map`
              }
            </p>
          </div>

          {/* List / Map toggle */}
          <div
            className="flex items-center gap-0.5 rounded-full p-1"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            <button
              onClick={() => setViewMode('list')}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={
                viewMode === 'list'
                  ? { background: 'white', color: '#c0392b' }
                  : { color: 'white' }
              }
            >
              ☰ List
            </button>
            <button
              onClick={switchToMap}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={
                viewMode === 'map'
                  ? { background: 'white', color: '#c0392b' }
                  : { color: 'white' }
              }
            >
              🗺 Map
            </button>
          </div>
        </div>

        {/* Filters — only shown in list mode */}
        {viewMode === 'list' && (
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${filter === f ? 'bg-white text-red-600' : 'text-white'
                  }`}
                style={filter !== f ? { background: 'rgba(255,255,255,0.2)' } : {}}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}

        {/* Map legend — only shown in map mode */}
        {viewMode === 'map' && (
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-white text-xs font-medium">Donors</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-300" />
              <span className="text-white text-xs font-medium">Requests</span>
            </div>
          </div>
        )}
      </div>

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <div style={{ height: 'calc(100vh - 200px)', position: 'relative' }}>
          <DonorMapView
            donors={mapDonors}
            requests={mapRequests}
            isLoading={mapLoading}
          />
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="px-4 pt-4 max-w-sm mx-auto space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <p className="text-4xl mb-3">🩸</p>
              <p className="text-gray-500 text-sm">No requests here yet</p>
            </div>
          ) : (
            filtered.map((req) => {
              const urg = URGENCY_BADGE[req.urgency] || URGENCY_BADGE.medium;
              return (
                <div key={req._id} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  {/* Top colored stripe based on urgency */}
                  {req.urgency === 'critical' && <div className="h-1 bg-red-500" />}
                  {req.urgency === 'high' && <div className="h-1 bg-orange-400" />}

                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Blood badge */}
                      <div
                        className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0"
                        style={{ background: '#fef2f2' }}
                      >
                        <span className="text-red-600 font-black text-base leading-tight">{req.bloodGroup}</span>
                        <span className="text-red-400 text-xs">{req.unitsRequired}u</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">{req.patientName}</p>
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                            style={{ background: urg.bg, color: urg.text }}
                          >
                            {urg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">By {req.requesterid?.name || 'Anonymous'}</p>
                        {req.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{req.notes}</p>}
                        {req.location?.city && (
                          <p className="text-xs text-gray-400 mt-0.5">📍 {req.location.city}</p>
                        )}
                      </div>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 capitalize ${req.status === 'fulfilled' ? 'bg-green-50 text-green-700'
                        : req.status === 'accepted' ? 'bg-blue-50 text-blue-700'
                          : 'bg-amber-50 text-amber-700'
                        }`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Action */}
                    {req.status === 'pending' && user?.role === 'donor' && (
                      <button
                        onClick={() => handleAccept(req._id)}
                        disabled={acceptingId === req._id}
                        className="w-full py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}
                      >
                        {acceptingId === req._id ? 'Accepting…' : "🩸 I'll Donate"}
                      </button>
                    )}
                    {req.status === 'pending' && user?.role !== 'donor' && (
                      <div className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-amber-700 bg-amber-50">
                        ⏳ Waiting for a donor
                      </div>
                    )}
                    {req.status === 'accepted' && (
                      <div className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-blue-700 bg-blue-50">
                        ✓ Donor accepted
                      </div>
                    )}
                    {req.status === 'fulfilled' && (
                      <div className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-green-700 bg-green-50">
                        ✓ Fulfilled
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
