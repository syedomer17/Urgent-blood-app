import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default Leaflet marker icon (broken by bundlers that hash asset paths)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface MapPickerProps {
  center: LatLng;
  onMarkerMove: (coords: LatLng) => void;
}

const MapPicker = ({ center, onMarkerMove }: MapPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initialise map once on mount
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([center.lat, center.lng], { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLatLng();
      onMarkerMove({ lat, lng });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker + view when center prop changes (address selected)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const latlng: L.LatLngExpression = [center.lat, center.lng];
    markerRef.current.setLatLng(latlng);
    mapRef.current.flyTo(latlng, 15, { animate: true, duration: 0.8 });
  }, [center.lat, center.lng]);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden border border-outline-variant/20"
        style={{ height: 280 }}
      />
      <div className="flex justify-end px-1">
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${center.lat},${center.lng}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs font-bold text-primary flex items-center gap-1 hover:underline decoration-primary/30 underline-offset-4"
        >
          🌍 Open in Google Maps
        </a>
      </div>
    </div>
  );
};

export default MapPicker;
