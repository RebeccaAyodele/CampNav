/**
 * Hook for accessing device geolocation with permission handling.
 * Provides latitude, longitude, and loading/error states.
 *
 * Usage:
 *   const { coordinates, loading, error } = useGeolocation();
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *   return <Map lat={coordinates.lat} lng={coordinates.lng} />;
 */

import { useState, useCallback, useEffect } from "react";
import { logger } from "@/lib/logger";
import { ERROR_MESSAGES } from "@/constants";
import type { Coordinates } from "@/types";

interface GeolocationState {
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation(): GeolocationState & {
  requestLocation: () => void;
} {
  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: ERROR_MESSAGES.LOCATION_UNAVAILABLE,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setState({
          coordinates: { lat: latitude, lng: longitude },
          loading: false,
          error: null,
        });
        logger.info("User location obtained", { lat: latitude, lng: longitude });
      },
      (error) => {
        const errorMessage =
          error.code === 1
            ? ERROR_MESSAGES.LOCATION_PERMISSION_DENIED
            : ERROR_MESSAGES.LOCATION_UNAVAILABLE;
        setState({
          coordinates: null,
          loading: false,
          error: errorMessage,
        });
        logger.error("Geolocation error", { errorCode: error.code });
      },
      { timeout: 10000 }
    );
  }, []);

  // Optional: Auto-request on mount
  useEffect(() => {
    // Uncomment to auto-request on component mount
    // requestLocation();
  }, [requestLocation]);

  return {
    ...state,
    requestLocation,
  };
}
