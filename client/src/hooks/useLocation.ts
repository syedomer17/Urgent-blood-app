import { useEffect, useState } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setLocation(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return location;
};
