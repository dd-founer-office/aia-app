"use client";

import { useEffect, useState } from "react";

type OrientationPermissionAPI = {
  requestPermission?: () => Promise<"granted" | "denied">;
};

/**
 * Horizon Level Indicator (Mission Camera Constitution P5). Uses device
 * tilt (gamma) as a stable horizon proxy. iOS 13+ requires an explicit
 * permission gesture, exposed via requestPermission().
 */
export function useDeviceOrientation() {
  const [tiltDegrees, setTiltDegrees] = useState(0);
  const [supported, setSupported] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null) {
        setTiltDegrees(e.gamma);
        setSupported(true);
      }
    };

    const DOE = window.DeviceOrientationEvent as unknown as OrientationPermissionAPI;
    if (typeof DOE?.requestPermission === "function") {
      setNeedsPermission(true);
      return;
    }

    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, []);

  const requestPermission = async () => {
    const DOE = window.DeviceOrientationEvent as unknown as OrientationPermissionAPI;
    if (typeof DOE?.requestPermission !== "function") return;
    const result = await DOE.requestPermission();
    if (result !== "granted") return;
    setNeedsPermission(false);
    window.addEventListener("deviceorientation", (e) => {
      if (e.gamma !== null) {
        setTiltDegrees(e.gamma);
        setSupported(true);
      }
    });
  };

  return { tiltDegrees, supported, needsPermission, requestPermission };
}
