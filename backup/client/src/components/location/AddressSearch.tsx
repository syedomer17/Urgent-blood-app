import { useEffect, useRef, useState } from "react";
import useDebounce from "../../hooks/useDebounce";

export interface NominatimSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

interface AddressSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: NominatimSuggestion) => void;
  placeholder?: string;
}

const AddressSearch = ({
  value,
  onChange,
  onSelect,
  placeholder = "Search address...",
}: AddressSearchProps) => {
  const [suggestions, setSuggestions] = useState<NominatimSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(value, 400);

  // Fetch autocomplete suggestions from Nominatim
  useEffect(() => {
    if (debouncedQuery.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(debouncedQuery)}`,
      { headers: { "Accept-Language": "en" } }
    )
      .then((r) => r.json())
      .then((data: NominatimSuggestion[]) => {
        if (cancelled) return;
        setSuggestions(data);
        setOpen(data.length > 0);
        if (data.length === 0) setError("No results found.");
      })
      .catch(() => {
        if (!cancelled) setError("Could not fetch suggestions. Check your connection.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (suggestion: NominatimSuggestion) => {
    onChange(suggestion.display_name);
    onSelect(suggestion);
    setSuggestions([]);
    setOpen(false);
    setError(null);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="flex items-center bg-surface-container-low rounded-xl px-4 gap-2">
        <span className="material-symbols-outlined text-secondary text-xl shrink-0">
          search
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setError(null);
          }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent border-none py-3 focus:ring-0 placeholder:text-gray-400 text-sm"
          autoComplete="off"
        />
        {loading && (
          <span className="material-symbols-outlined animate-spin text-secondary text-xl shrink-0">
            progress_activity
          </span>
        )}
        {value && !loading && (
          <button
            type="button"
            onClick={() => { onChange(""); setSuggestions([]); setOpen(false); setError(null); }}
            className="shrink-0 text-secondary hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 hover:bg-primary/5 text-sm transition-colors border-b border-outline-variant/10 last:border-0 flex items-start gap-3"
              >
                <span className="material-symbols-outlined text-primary/60 text-base mt-0.5 shrink-0">
                  location_on
                </span>
                <span className="text-on-surface line-clamp-2">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Empty / error state */}
      {!open && error && value.trim().length >= 3 && !loading && (
        <p className="text-xs text-secondary mt-1 ml-1">{error}</p>
      )}
    </div>
  );
};

export default AddressSearch;
