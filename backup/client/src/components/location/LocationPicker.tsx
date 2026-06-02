import { useState } from "react";
import AddressSearch from "./AddressSearch";
import type { NominatimSuggestion } from "./AddressSearch";
import MapPicker from "./MapPicker";
import type { LatLng } from "./MapPicker";
import toast from "react-hot-toast";

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface LocationPickerProps {
  value: LocationData | null;
  onChange: (data: LocationData) => void;
}

// Default center — India (good default for this app)
const DEFAULT_CENTER: LatLng = { lat: 20.5937, lng: 78.9629 };

const LocationPicker = ({ value, onChange }: LocationPickerProps) => {
  const [inputText, setInputText] = useState(value?.address ?? "");
  const [mapCenter, setMapCenter] = useState<LatLng>(
    value ? { lat: value.lat, lng: value.lng } : DEFAULT_CENTER
  );
  const [showMap, setShowMap] = useState(!!value);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Called when user clicks an autocomplete suggestion
  const handleSuggestionSelect = (s: NominatimSuggestion) => {
    const coords: LatLng = { lat: parseFloat(s.lat), lng: parseFloat(s.lon) };
    const city = s.address.city ?? s.address.town ?? s.address.village ?? "";
    setMapCenter(coords);
    setShowMap(true);
    onChange({
      address: s.display_name,
      lat: coords.lat,
      lng: coords.lng,
      city,
      state: s.address.state ?? "",
      zipCode: s.address.postcode ?? "",
    });
  };

  // Called when user drags the marker — reverse geocode new position
  const handleMarkerMove = async (coords: LatLng) => {
    setMapCenter(coords);
    setReverseLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const address: string = data.display_name ?? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      const city = data.address?.city ?? data.address?.town ?? data.address?.village ?? "";
      setInputText(address);
      onChange({
        address,
        lat: coords.lat,
        lng: coords.lng,
        city,
        state: data.address?.state ?? "",
        zipCode: data.address?.postcode ?? "",
      });
    } catch {
      // Fallback: store raw coords as address
      const fallback = `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
      setInputText(fallback);
      onChange({ address: fallback, lat: coords.lat, lng: coords.lng });
    } finally {
      setReverseLoading(false);
    }
  };

  // "Use My Location" — browser geolocation + reverse geocode
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMapCenter(coords);
        setShowMap(true);
        await handleMarkerMove(coords);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please allow access.");
        } else {
          toast.error("Could not get your location. Try again.");
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search input row */}
      <div className="flex gap-2">
        <div className="flex-1">
          <AddressSearch
            value={inputText}
            onChange={setInputText}
            onSelect={handleSuggestionSelect}
            placeholder="Search hospital or address..."
          />
        </div>

        {/* Use My Location button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={geoLoading}
          title="Use my current location"
          className="shrink-0 bg-primary/10 text-primary rounded-xl px-3 flex items-center gap-1.5 text-sm font-bold hover:bg-primary/20 transition-colors disabled:opacity-60"
        >
          {geoLoading ? (
            <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              my_location
            </span>
          )}
          <span className="hidden sm:inline">My Location</span>
        </button>
      </div>

      {/* Reverse geocoding indicator */}
      {reverseLoading && (
        <p className="text-xs text-secondary flex items-center gap-1.5">
          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
          Finding address for marker position...
        </p>
      )}

      {/* Map — shown after a location is selected */}
      {showMap && (
        <div className="space-y-1">
          <p className="text-xs text-secondary ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">drag_indicator</span>
            Drag the marker to fine-tune the location
          </p>
          <MapPicker center={mapCenter} onMarkerMove={handleMarkerMove} />
        </div>
      )}

      {/* Selected location summary */}
      {value && (
        <div className="bg-primary/5 rounded-xl px-4 py-3 flex items-start gap-3">
          <span
            className="material-symbols-outlined text-primary text-lg mt-0.5 shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            location_on
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-on-surface font-medium line-clamp-2">{value.address}</p>
            <p className="text-[10px] text-secondary mt-0.5">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
