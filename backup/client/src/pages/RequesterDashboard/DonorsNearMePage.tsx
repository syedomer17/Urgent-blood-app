import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";
import { useSocket } from "../../hooks/useSocket";
import ChatWindow, { type ChatMsg } from "../../components/chat/ChatWindow";

// Fix Leaflet default icon paths broken by Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

// ─── Types ───────────────────────────────────────────────────────────────────

interface Donor {
  _id: string;
  name: string;
  bloodGroup: string;
  availability: boolean;
  trustRating: number;
  totalDonations: number;
  lastDonationDate?: string;
  contactNumber?: string;
  location?: {
    coordinates?: number[]; // [lng, lat]
    address?: string;
    city?: string;
    state?: string;
  };
}

interface DonorWithDistance extends Donor {
  distance: number; // km
}

// ChatMsg is imported from ChatWindow

interface UserProfile {
  _id: string;
  name: string;
  bloodGroup?: string;
  role: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Haversine distance in km */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

const BLOOD_COLORS: Record<string, string> = {
  "A+": "#ef4444", "A-": "#f97316",
  "B+": "#8b5cf6", "B-": "#a78bfa",
  "AB+": "#06b6d4", "AB-": "#0891b2",
  "O+": "#22c55e", "O-": "#16a34a",
};

const RADIUS_OPTIONS = [5, 10, 25, 50];
const DONATION_FILTERS = ["all", "eligible", "cooldown"] as const;

function daysSince(dateStr?: string): number {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ─── DonorMap (Leaflet, vanilla) ─────────────────────────────────────────────

interface DonorMapProps {
  userPos: { lat: number; lng: number };
  donors: DonorWithDistance[];
  selectedDonorId: string | null;
  onDonorClick: (id: string) => void;
  radiusKm: number;
}

function DonorMap({ userPos, donors, selectedDonorId, onDonorClick, radiusKm }: DonorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);

  // Build a colored circle marker for a donor
  const buildMarker = useCallback(
    (donor: DonorWithDistance, map: L.Map): L.CircleMarker | null => {
      const coords = donor.location?.coordinates;
      if (!coords || coords.length < 2) return null;
      const [lng, lat] = coords;
      const color = BLOOD_COLORS[donor.bloodGroup] ?? "#ef4444";
      const isSelected = donor._id === selectedDonorId;

      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 14 : 10,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: donor.availability ? 0.9 : 0.45,
      }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:Inter,sans-serif;min-width:140px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="background:${color};color:#fff;padding:2px 8px;border-radius:8px;font-weight:800;font-size:13px">${donor.bloodGroup}</span>
            <span style="width:8px;height:8px;border-radius:50%;background:${donor.availability ? "#22c55e" : "#9ca3af"};display:inline-block"></span>
          </div>
          <div style="font-weight:700;font-size:14px;color:#1a1c1d">${donor.name}</div>
          <div style="font-size:11px;color:#666;margin-top:2px">⭐ ${donor.trustRating?.toFixed(1) ?? "0.0"} · ${donor.totalDonations} donations</div>
          <div style="font-size:11px;color:#666">📍 ${fmtDist(donor.distance)} away</div>
          ${donor.location?.city ? `<div style="font-size:11px;color:#666">${donor.location.city}</div>` : ""}
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #eee;">
            <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="color:#b71c1c;font-size:12px;font-weight:700;text-decoration:none;display:flex;align-items:center;gap:4px;">
              🌍 Open in Maps
            </a>
          </div>
        </div>
      `);

      marker.on("click", () => onDonorClick(donor._id));
      return marker;
    },
    [selectedDonorId, onDonorClick]
  );

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [userPos.lat, userPos.lng],
      zoom: 13,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update user marker & radius circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    userMarkerRef.current?.remove();
    radiusCircleRef.current?.remove();

    userMarkerRef.current = L.marker([userPos.lat, userPos.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 3px rgba(37,99,235,0.3)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    })
      .addTo(map)
      .bindPopup("<b>You are here</b>");

    radiusCircleRef.current = L.circle([userPos.lat, userPos.lng], {
      radius: radiusKm * 1000,
      color: "#2563eb",
      fillColor: "#2563eb",
      fillOpacity: 0.04,
      weight: 1.5,
      dashArray: "6 4",
    }).addTo(map);

    map.flyTo([userPos.lat, userPos.lng], 13, { animate: true, duration: 0.6 });
  }, [userPos.lat, userPos.lng, radiusKm]);

  // Update donor markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    // Add new markers
    donors.forEach((donor) => {
      const m = buildMarker(donor, map);
      if (m) markersRef.current.set(donor._id, m);
    });
  }, [donors, buildMarker]);

  // Highlight selected donor on the map
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const donor = donors.find((d) => d._id === id);
      const isSelected = id === selectedDonorId;
      const color = BLOOD_COLORS[donor?.bloodGroup ?? ""] ?? "#ef4444";
      marker.setStyle({
        radius: isSelected ? 14 : 10,
        fillColor: color,
        weight: isSelected ? 3 : 2,
      });
      if (isSelected) {
        marker.openPopup();
        const coords = donor?.location?.coordinates;
        if (coords) mapRef.current?.panTo([coords[1], coords[0]], { animate: true });
      }
    });
  }, [selectedDonorId, donors]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl overflow-hidden border border-outline-variant/20"
      style={{ height: 300 }}
    />
  );
}

// ─── ChatDrawer ───────────────────────────────────────────────────────────────

// ChatDrawer is now handled by ChatWindow + local state in the main page

// ─── DonorCard ────────────────────────────────────────────────────────────────

interface DonorCardProps {
  donor: DonorWithDistance;
  selected: boolean;
  onSelect: () => void;
  onChat: () => void;
  onPing: () => void;
  pingLoading: boolean;
  viewerRole: string;
}

function DonorCard({ donor, selected, onSelect, onChat, onPing, pingLoading, viewerRole }: DonorCardProps) {
  const color = BLOOD_COLORS[donor.bloodGroup] ?? "#ef4444";
  const stars = Math.round(donor.trustRating ?? 0);

  return (
    <div
      onClick={onSelect}
      className={`bg-surface-container-lowest rounded-2xl p-4 transition-all cursor-pointer select-none ${
        selected
          ? "ring-2 ring-primary shadow-lg scale-[1.01]"
          : "ring-1 ring-outline-variant/10 hover:shadow-md hover:scale-[1.005]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Blood group badge */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-headline font-black text-base text-white shrink-0 shadow-md"
          style={{ background: color, opacity: donor.availability ? 1 : 0.55 }}
        >
          {donor.bloodGroup}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + availability */}
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-headline font-bold text-base text-on-surface truncate">
              {donor.name}
            </h4>
            <span
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                donor.availability
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: donor.availability ? "#22c55e" : "#9ca3af" }}
              />
              {donor.availability ? "Available" : "Unavailable"}
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {/* Stars */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className="material-symbols-outlined text-xs"
                  style={{
                    fontVariationSettings: i <= stars ? "'FILL' 1" : "'FILL' 0",
                    color: i <= stars ? "#f59e0b" : "#d1d5db",
                    fontSize: 13,
                  }}
                >
                  star
                </span>
              ))}
              <span className="text-[10px] text-secondary ml-0.5">
                {donor.trustRating?.toFixed(1) ?? "0.0"}
              </span>
            </div>

            {/* Donations */}
            <span className="text-xs text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
              {donor.totalDonations} donated
            </span>

            {/* Distance */}
            <span className="text-xs text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">near_me</span>
              {fmtDist(donor.distance)}
            </span>

            {/* City */}
            {donor.location?.city && (
              <span className="text-xs text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">location_on</span>
                {donor.location.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChat(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-xs hover:bg-primary/20 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
            chat_bubble
          </span>
          Chat
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPing(); }}
          disabled={pingLoading}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-error/10 text-error font-bold text-xs hover:bg-error/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {pingLoading ? (
            <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              notifications_active
            </span>
          )}
          Ping
        </button>
      </div>

      {/* One-Tap Contact (only visible to hospitals/requesters and admins) */}
      {['requester', 'admin', 'hospital'].includes((viewerRole || '').toString()) && donor.contactNumber && (
        <div className="flex gap-2 mt-2">
          <a
            href={`tel:${donor.contactNumber}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
            style={{ background: "#dcfce7", color: "#15803d", textDecoration: "none" }}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
            Call
          </a>
          <a
            href={`https://wa.me/${donor.contactNumber.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
            style={{ background: "#d1fae5", color: "#047857", textDecoration: "none" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#047857"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.507 3.932 1.395 5.608L.05 23.708a.6.6 0 00.735.728l5.956-1.554A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.6c-1.876 0-3.654-.52-5.192-1.488l-.372-.228-3.857 1.007 1.027-3.752-.25-.395A9.552 9.552 0 012.4 12c0-5.302 4.298-9.6 9.6-9.6s9.6 4.298 9.6 9.6-4.298 9.6-9.6 9.6z"/></svg>
            WhatsApp
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(donor.contactNumber!);
              toast.success("Number copied!");
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all"
            style={{ background: "#f0f0f0", color: "#666" }}
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props {
  user: UserProfile;
}

const DonorsNearMePage = ({ user }: Props) => {
  const { socket, connected } = useSocket();

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [donors, setDonors] = useState<DonorWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(10); // km
  const [sortBy, setSortBy] = useState<"distance" | "rating" | "availability">("distance");
  const [bloodFilter, setBloodFilter] = useState<string>("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [donationFilter, setDonationFilter] = useState<(typeof DONATION_FILTERS)[number]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chatDonor, setChatDonor] = useState<Donor | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
  const [pingLoadingId, setPingLoadingId] = useState<string | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ── Geolocation ──────────────────────────────────────────────────────────

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location access denied. Please enable it in browser settings.");
        } else {
          toast.error("Could not get your location. Try again.");
        }
      },
      { timeout: 12000, maximumAge: 60000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // ── Fetch nearby donors ──────────────────────────────────────────────────

  const fetchDonors = useCallback(async () => {
    if (!userPos) return;
    setLoading(true);
    try {
      const radiusMetres = radius * 1000;
      const res = await fetch(
        `/api/v1/donors/near?lat=${userPos.lat}&lng=${userPos.lng}&radius=${radiusMetres}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to load nearby donors.");
        return;
      }
      const raw: Donor[] = data.data ?? [];
      const withDist: DonorWithDistance[] = raw
        .filter((d) => d._id !== user._id)
        .map((d) => {
          const coords = d.location?.coordinates;
          const dist = coords
            ? haversine(userPos.lat, userPos.lng, coords[1], coords[0])
            : 9999;
          return { ...d, distance: dist };
        });
      setDonors(withDist);
      if (withDist.length === 0) toast("No donors found in this area. Try increasing the radius.", { icon: "📍" });
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [userPos, radius, user._id]);

  useEffect(() => {
    if (userPos) fetchDonors();
  }, [userPos, radius, fetchDonors]);

  // ── Socket: live availability updates ────────────────────────────────────

  useEffect(() => {
    if (!socket) return;
    const onAvailChange = (data: { donorId: string; available: boolean }) => {
      setDonors((prev) =>
        prev.map((d) =>
          d._id === data.donorId ? { ...d, availability: data.available } : d
        )
      );
    };
    const onPingSent = () => toast.success("Donor has been pinged!");
    socket.on("donor_availability_changed", onAvailChange);
    socket.on("ping_sent", onPingSent);
    return () => {
      socket.off("donor_availability_changed", onAvailChange);
      socket.off("ping_sent", onPingSent);
    };
  }, [socket]);

  // ── Ping donor ───────────────────────────────────────────────────────────

  const handlePing = (donor: DonorWithDistance) => {
    if (!socket || !connected) {
      toast.error("Real-time connection not available. Please refresh.");
      return;
    }
    setPingLoadingId(donor._id);
    socket.emit("ping_donor", {
      donorId: donor._id,
      bloodGroup: user.bloodGroup ?? "Unknown",
      patientName: "Patient",
      urgency: "high",
      location: userPos
        ? { latitude: userPos.lat, longitude: userPos.lng }
        : null,
    });
    setTimeout(() => setPingLoadingId(null), 2000);
  };

  // ── Chat: load history when donor changes ────────────────────────────────

  useEffect(() => {
    if (!chatDonor) { setChatMessages([]); return; }
    setChatHistoryLoading(true);
    fetch(`/api/v1/chat/${chatDonor._id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        const msgs: ChatMsg[] = (data.data ?? []).map((m: { _id: string; from: string; text: string; createdAt: string }) => ({
          id: m._id,
          mine: m.from === user._id,
          text: m.text,
          timestamp: new Date(m.createdAt),
        }));
        setChatMessages(msgs);
      })
      .catch(() => {})
      .finally(() => setChatHistoryLoading(false));
  }, [chatDonor, user._id]);

  // ── Chat: live incoming messages ─────────────────────────────────────────

  useEffect(() => {
    if (!socket || !chatDonor) return;
    const onMsg = (data: { _id: string; from: string; message: string; timestamp: string }) => {
      if (data.from !== chatDonor._id) return;
      setChatMessages((prev): ChatMsg[] => {
        if (prev.some((m) => m.id === data._id)) return prev;
        return [...prev, { id: data._id, mine: false, text: data.message, timestamp: new Date(data.timestamp) }];
      });
    };
    socket.on("receive_message", onMsg);
    return () => { socket.off("receive_message", onMsg); };
  }, [socket, chatDonor]);

  // ── Chat: send message ───────────────────────────────────────────────────

  const handleChatSend = useCallback((text: string) => {
    if (!socket || !chatDonor) return;
    const tempId = `tmp_${Date.now()}`;
    setChatMessages((prev): ChatMsg[] => [...prev, { id: tempId, mine: true, text, timestamp: new Date() }]);
    socket.emit("send_message", { recipientId: chatDonor._id, message: text });
    socket.once("message_sent", (data: { _id: string; message: string; timestamp: string }) => {
      setChatMessages((prev): ChatMsg[] =>
        prev.map((m) => (m.id === tempId ? { ...m, id: data._id, timestamp: new Date(data.timestamp) } : m))
      );
    });
  }, [socket, chatDonor]);

  // ── Card scroll into view when selected from map ─────────────────────────

  const handleDonorSelect = (id: string) => {
    setSelectedId(id);
    const el = cardRefs.current.get(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // ── Filtering + sorting ──────────────────────────────────────────────────

  const filtered = donors
    .filter((d) => {
      if (bloodFilter !== "all" && d.bloodGroup !== bloodFilter) return false;
      if (availableOnly && !d.availability) return false;
      const donatedDaysAgo = daysSince(d.lastDonationDate);
      if (donationFilter === "eligible" && donatedDaysAgo < 90) return false;
      if (donationFilter === "cooldown" && donatedDaysAgo >= 90) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "distance") return a.distance - b.distance;
      if (sortBy === "rating") return (b.trustRating ?? 0) - (a.trustRating ?? 0);
      // availability: available first
      return Number(b.availability) - Number(a.availability);
    });

  const availableCount = donors.filter((d) => d.availability).length;

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <main className="pb-24">
      {/* Compact Header */}
      <section className="px-4 pt-2 pb-3 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-xl font-extrabold text-on-surface tracking-tight">
              Donors Near Me
            </h1>
            <p className="text-secondary text-xs mt-0.5">
              Find compatible blood donors in your area
            </p>
          </div>
          {/* Socket status */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
              connected ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: connected ? "#22c55e" : "#6b7280" }}
            />
            {connected ? "Live" : "Offline"}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 bg-red-50 rounded-xl px-3 py-2 text-center">
            <div className="text-lg font-headline font-black text-red-700">{donors.length}</div>
            <div className="text-[10px] font-bold text-red-600/70">Nearby</div>
          </div>
          <div className="flex-1 bg-green-50 rounded-xl px-3 py-2 text-center">
            <div className="text-lg font-headline font-black text-green-700">{availableCount}</div>
            <div className="text-[10px] font-bold text-green-600/70">Available</div>
          </div>
          <div className="flex-1 bg-blue-50 rounded-xl px-3 py-2 text-center">
            <div className="text-lg font-headline font-black text-blue-700">{radius} km</div>
            <div className="text-[10px] font-bold text-blue-600/70">Radius</div>
          </div>
        </div>
      </section>

      <div className="px-4 max-w-2xl mx-auto space-y-5 pt-5">

        {/* Location permission prompt */}
        {!userPos && !geoLoading && (
          <div className="bg-primary/5 rounded-2xl p-6 text-center space-y-3">
            <span
              className="material-symbols-outlined text-5xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
            <p className="font-headline font-bold text-on-surface">
              Enable Location Access
            </p>
            <p className="text-sm text-secondary">
              We need your location to show nearby donors.
            </p>
            <button
              onClick={requestLocation}
              className="bg-primary text-white font-bold px-6 py-3 rounded-2xl active:scale-95 transition-all"
            >
              Allow Location
            </button>
          </div>
        )}

        {geoLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-secondary">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            Getting your location...
          </div>
        )}

        {userPos && (
          <>
            {/* Controls */}
            <div className="space-y-3">
              {/* Radius buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-secondary">Radius:</span>
                {RADIUS_OPTIONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadius(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      radius === r
                        ? "bg-primary text-white"
                        : "bg-surface-container-low text-secondary hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {r} km
                  </button>
                ))}
                <button
                  onClick={fetchDonors}
                  disabled={loading}
                  className="ml-auto flex items-center gap-1 text-xs font-bold text-primary hover:underline disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-sm ${loading ? "animate-spin" : ""}`}>
                    refresh
                  </span>
                  Refresh
                </button>
              </div>

              {/* Filters row */}
              <div className="flex gap-2 flex-wrap items-center">
                {/* Blood group */}
                <select
                  value={bloodFilter}
                  onChange={(e) => setBloodFilter(e.target.value)}
                  className="bg-surface-container-low border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/30 transition-all"
                >
                  <option value="all">All Blood Groups</option>
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                {/* Available only toggle */}
                <button
                  onClick={() => setAvailableOnly((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    availableOnly
                      ? "bg-green-100 text-green-700"
                      : "bg-surface-container-low text-secondary"
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: availableOnly ? "#22c55e" : "#9ca3af" }}
                  />
                  Available only
                </button>

                <select
                  value={donationFilter}
                  onChange={(e) => setDonationFilter(e.target.value as typeof donationFilter)}
                  className="bg-surface-container-low border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/30 transition-all"
                >
                  <option value="all">All Donations</option>
                  <option value="eligible">90+ days since donation</option>
                  <option value="cooldown">Under 90 days</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="ml-auto bg-surface-container-low border-none rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/30 transition-all"
                >
                  <option value="distance">Sort: Nearest</option>
                  <option value="rating">Sort: Top Rated</option>
                  <option value="availability">Sort: Available</option>
                </select>
              </div>
            </div>

            {/* Map */}
            <DonorMap
              userPos={userPos}
              donors={filtered}
              selectedDonorId={selectedId}
              onDonorClick={handleDonorSelect}
              radiusKm={radius}
            />

            {/* Blood group legend */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(BLOOD_COLORS).map(([bg, color]) => (
                <div key={bg} className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ background: color }}
                  />
                  <span className="text-[10px] text-secondary font-bold">{bg}</span>
                </div>
              ))}
            </div>

            {/* Donor list */}
            <section className="space-y-3">
              <h2 className="font-headline font-extrabold text-xl text-on-surface">
                {filtered.length > 0
                  ? `${filtered.length} Donor${filtered.length > 1 ? "s" : ""} Found`
                  : "No Donors Found"}
              </h2>

              {loading ? (
                <div className="text-center py-12">
                  <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                    progress_activity
                  </span>
                  <p className="text-secondary text-sm mt-2">Searching nearby...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-2xl p-10 text-center space-y-3">
                  <span className="material-symbols-outlined text-5xl text-secondary/30">
                    person_search
                  </span>
                  <p className="font-bold text-secondary">No donors match your filters</p>
                  <button
                    onClick={() => {
                      setBloodFilter("all");
                      setAvailableOnly(false);
                      if (radius < 50) setRadius(radius * 2 > 50 ? 50 : radius * 2);
                    }}
                    className="text-primary font-bold text-sm hover:underline"
                  >
                    Reset filters / Increase radius
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((donor) => (
                    <div
                      key={donor._id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(donor._id, el);
                        else cardRefs.current.delete(donor._id);
                      }}
                    >
                      <DonorCard
                        donor={donor}
                        selected={selectedId === donor._id}
                        onSelect={() => handleDonorSelect(donor._id)}
                        onChat={() => setChatDonor(donor)}
                        onPing={() => handlePing(donor)}
                        pingLoading={pingLoadingId === donor._id}
                        viewerRole={user.role}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Chat window */}
      {chatDonor && (
        <ChatWindow
          messages={chatMessages}
          historyLoading={chatHistoryLoading}
          peerName={chatDonor.name}
          peerInitials={chatDonor.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
          peerOnline={chatDonor.availability}
          accentColor={BLOOD_COLORS[chatDonor.bloodGroup] ?? "#ef4444"}
          socket={socket}
          peerId={chatDonor._id}
          onSend={handleChatSend}
          onClose={() => setChatDonor(null)}
        />
      )}
    </main>
  );
};

export default DonorsNearMePage;
