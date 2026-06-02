import { useState } from "react";

export interface LocationData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  areaName: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationInputProps {
  value: LocationData;
  onChange: (value: LocationData) => void;
}

const LocationInput = ({ value, onChange }: LocationInputProps) => {
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof LocationData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  const detectLocation = () => {
    if (!navigator.geolocation || loading) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await response.json();
          const address = data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

          onChange({
            ...value,
            address,
            city: data.address?.city ?? data.address?.town ?? data.address?.village ?? value.city,
            state: data.address?.state ?? value.state,
            zipCode: data.address?.postcode ?? value.zipCode,
            latitude,
            longitude,
          });
        } catch {
          onChange({
            ...value,
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            latitude,
            longitude,
          });
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        // silently fail — user can enter manually
      }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-xs font-bold font-headline text-secondary uppercase px-1">
        Your Address
      </label>
      <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-transparent focus-within:border-primary/20 transition-all">
        {/* Address row with location button */}
        <div className="flex items-center gap-4 p-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <span className="material-symbols-outlined text-primary">
              location_on
            </span>
          </div>
          <div className="grow">
            <input
              type="text"
              placeholder="Enter your address or use your current location..."
              value={value.address}
              onChange={(e) => updateField("address", e.target.value)}
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-on-surface text-sm font-medium placeholder:text-gray-400"
            />
          </div>
          <button
            type="button"
            onClick={detectLocation}
            disabled={loading}
            className="text-primary text-xs font-bold hover:underline transition-all"
          >
            {loading ? "Detecting..." : "Use my location"}
          </button>
        </div>

        {/* City, State, Zip row */}
        <div className="grid grid-cols-3 gap-3 px-4 pb-4">
          <input
            type="text"
            placeholder="City"
            value={value.city}
            onChange={(e) => updateField("city", e.target.value)}
            className="bg-surface-container-lowest ring-1 ring-outline-variant/20 rounded-lg p-3 text-sm text-on-surface placeholder:text-gray-400 border-none focus:ring-2 focus:ring-primary transition-all"
          />
          <input
            type="text"
            placeholder="State"
            value={value.state}
            onChange={(e) => updateField("state", e.target.value)}
            className="bg-surface-container-lowest ring-1 ring-outline-variant/20 rounded-lg p-3 text-sm text-on-surface placeholder:text-gray-400 border-none focus:ring-2 focus:ring-primary transition-all"
          />
          <input
            type="text"
            placeholder="Zip Code"
            value={value.zipCode}
            onChange={(e) => updateField("zipCode", e.target.value)}
            className="bg-surface-container-lowest ring-1 ring-outline-variant/20 rounded-lg p-3 text-sm text-on-surface placeholder:text-gray-400 border-none focus:ring-2 focus:ring-primary transition-all"
          />
        </div>

        {/* Bottom status bar */}
        <div className="h-10 w-full relative bg-surface-container">
          <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent" />
          <div className="absolute bottom-2 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                value.latitude !== null
                  ? "bg-green-500 animate-pulse"
                  : "bg-gray-400"
              }`}
            />
            <span className="text-[10px] font-bold text-secondary uppercase">
              {value.latitude !== null
                ? "Address Detected"
                : "No GPS Signal"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationInput;
