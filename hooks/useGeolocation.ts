"use client";

import { useEffect, useState } from "react";

export interface GeoReading {
  lat: number | null;
  lng: number | null;
  accuracyMeters: number | null;
  available: boolean;
}

export function useGeolocation(): GeoReading {
  const [reading, setReading] = useState<GeoReading>({
    lat: null,
    lng: null,
    accuracyMeters: null,
    available: false,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setReading({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
          available: true,
        });
      },
      () => setReading((r) => ({ ...r, available: false })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return reading;
}
