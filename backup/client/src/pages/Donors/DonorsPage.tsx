import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const BLOOD_COLORS: Record<string, string> = {
  "A+": "#ef4444", "A-": "#f97316",
  "B+": "#8b5cf6", "B-": "#a78bfa",
  "AB+": "#06b6d4", "AB-": "#0891b2",
  "O+": "#22c55e", "O-": "#16a34a",
};

interface Donor {
  _id: string;
  name: string;
  bloodGroup: string;
  availability: boolean;
  trustRating: number;
  totalDonations: number;
  contactNumber?: string;
  location?: {
    coordinates?: number[]; // [lng, lat]
    address?: string;
    city?: string;
  };
}

function DonorMap({ donors, selectedDonorId }: { donors: Donor[]; selectedDonorId: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update donor markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();
    
    const bounds = L.latLngBounds([]);

    donors.forEach(donor => {
      const coords = donor.location?.coordinates;
      if (!coords || coords.length < 2) return;
      const [lng, lat] = coords;
      const color = BLOOD_COLORS[donor.bloodGroup] || "#ef4444";
      const isSelected = donor._id === selectedDonorId;

      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 14 : 10,
        fillColor: color,
        color: "#fff",
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: donor.availability ? 0.9 : 0.45,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:140px">
          <b>${donor.name}</b><br/>${donor.bloodGroup} | ${donor.location?.city || "Unknown"}
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
            <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="color:#b71c1c;font-size:12px;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:4px;">
              🌍 Open in Maps
            </a>
          </div>
        </div>
      `);
      marker.on("click", () => {
        // Just let the popup open, the parent clicks handle centering
      });
      markersRef.current.set(donor._id, marker);
      bounds.extend([lat, lng]);
    });

    if (bounds.isValid() && !selectedDonorId) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
    }
  }, [donors, selectedDonorId]);

  // Handle selection pan
  useEffect(() => {
    if (!selectedDonorId) return;
    const marker = markersRef.current.get(selectedDonorId);
    if (marker) {
      marker.openPopup();
      const latlng = marker.getLatLng();
      mapRef.current?.flyTo(latlng, 13, { animate: true, duration: 0.6 });
    }
  }, [selectedDonorId]);

  return <div ref={containerRef} className="w-full rounded-2xl border border-outline-variant/20 z-0 relative" style={{ height: 350 }} />;
}

const DonorsPage = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [bloodFilter, setBloodFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const res = await fetch("/api/v1/donors", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setDonors(data.data?.donors ?? data.data ?? []);
        }
      } catch {
        toast.error("Failed to load donors.");
      } finally {
        setLoading(false);
      }
    };
    fetchDonors();
  }, []);

  const searchByCity = async () => {
    if (!cityFilter.trim()) {
      toast.error('Enter a city name to search');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/donors/search?city=${encodeURIComponent(cityFilter)}&radius=20000`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.message || 'City search failed');
        return;
      }
      const data = await res.json();
      setDonors(data.data ?? []);
    } catch {
      toast.error('Network error during city search');
    } finally {
      setLoading(false);
    }
  };

  const filtered = donors.filter((d) => {
    if (bloodFilter && d.bloodGroup !== bloodFilter) return false;
    return true;
  });

  return (
    <main className="pt-4 pb-8 px-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
        <div className="space-y-1">
          <span className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
            Community
          </span>
          <h2 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
            Donors
          </h2>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3 mb-10 items-center">
        <div className="relative">
          <select
            value={bloodFilter}
            onChange={(e) => setBloodFilter(e.target.value)}
            className="appearance-none bg-surface-container-lowest border-none ring-1 ring-outline-variant/20 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:ring-primary focus:ring-2 transition-all outline-none"
          >
            <option value="">All Blood Groups</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-2.5 text-secondary pointer-events-none text-lg">
            expand_more
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="City (e.g. Mumbai)"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-surface-container-lowest ring-1 ring-outline-variant/20 rounded-xl px-4 py-2.5 text-sm focus:ring-primary/50 focus:ring-2 transition-all outline-none"
          />
          <button onClick={searchByCity} className="bg-primary text-white px-4 py-2 rounded-xl font-bold">Search</button>
          <button onClick={() => { setCityFilter(''); /* reload all donors */ setLoading(true); fetch('/api/v1/donors', { credentials: 'include' }).then(async res => { if (res.ok) { const data = await res.json(); setDonors(data.data?.donors ?? data.data ?? []); } }).catch(()=>toast.error('Failed to reload')).finally(()=>setLoading(false)); }} className="bg-surface-container-highest px-4 py-2 rounded-xl">Reset</button>
        </div>
      </div>

      {/* Donors List */}
      {loading ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">
            progress_activity
          </span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-secondary/30 mb-4">
            group_off
          </span>
          <p className="text-secondary font-medium">No donors found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <DonorMap donors={filtered} selectedDonorId={selectedDonorId} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((donor) => {
              const isSelected = selectedDonorId === donor._id;
              return (
                <div
                  key={donor._id}
                  onClick={() => setSelectedDonorId(donor._id)}
                  className={`bg-surface-container-lowest rounded-2xl p-6 transition-all flex items-center gap-5 cursor-pointer ${
                    isSelected ? "ring-2 ring-primary shadow-lg scale-[1.02]" : "ring-1 ring-surface-container hover:shadow-lg"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center shrink-0">
                <span className="font-headline font-black text-lg text-primary">
                  {donor.bloodGroup}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-base text-on-surface truncate">
                    {donor.name}
                  </h3>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      donor.availability ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-secondary">
                  <span className="flex items-center gap-1">
                    <span
                      className="material-symbols-outlined text-xs"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    {donor.trustRating?.toFixed(1) ?? "0.0"}
                  </span>
                  <span>{donor.totalDonations} donations</span>
                  {donor.location?.city && (
                    <span className="flex items-center gap-0.5 truncate">
                      <span className="material-symbols-outlined text-xs">
                        location_on
                      </span>
                      {donor.location.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
};

export default DonorsPage;
