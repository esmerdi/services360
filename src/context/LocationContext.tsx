import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Coords {
  latitude: number;
  longitude: number;
}

interface LocationContextValue {
  coords: Coords | null;
  address: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const LocationContext = createContext<LocationContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const lastPersistAtRef = useRef(0);
  const lastPersistCoordsRef = useRef<Coords | null>(null);

  const refresh = useCallback(() => setTick((t: number) => t + 1), []);

  useEffect(() => {
    if (!user) {
      setCoords(null);
      setAddress(null);
      setError(null);
      setLoading(false);
      return;
    }
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    const persistLocation = async (latitude: number, longitude: number, force = false) => {
      const now = Date.now();
      const lastCoords = lastPersistCoordsRef.current;
      const movedEnough = !lastCoords
        || Math.abs(lastCoords.latitude - latitude) > 0.0001
        || Math.abs(lastCoords.longitude - longitude) > 0.0001;
      const staleEnough = now - lastPersistAtRef.current > 20000;

      if (!force && !movedEnough && !staleEnough) {
        return;
      }

      await supabase.from('locations').upsert(
        {
          user_id: user.id,
          latitude,
          longitude,
          address: null,
        },
        { onConflict: 'user_id' }
      );

      lastPersistAtRef.current = now;
      lastPersistCoordsRef.current = { latitude, longitude };
    };

    if (user.role === 'provider') {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setCoords({ latitude, longitude });
          void persistLocation(latitude, longitude);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        await persistLocation(latitude, longitude, true);

        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [user, tick]);

  return (
    <LocationContext.Provider value={{ coords, address, loading, error, refresh }}>
      {children}
    </LocationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used inside LocationProvider');
  return ctx;
}
