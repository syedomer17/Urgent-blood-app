import { useEffect, useState } from "react";

/**
 * Delays updating the returned value until `delay` ms have passed
 * since the last change — prevents hammering the Nominatim API on every keystroke.
 */
function useDebounce<T>(value: T, delay: number = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
