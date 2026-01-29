import { useState, useEffect } from 'react';

interface GeolocationState {
  lat: number;
  lng: number;
  error: string | null;
  loading: boolean;
}

// Default fallback location (NYC)
const DEFAULT_LOCATION = { lat: 40.7128, lng: -74.006 };

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    ...DEFAULT_LOCATION,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      setState({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        error: null,
        loading: false,
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage = 'Unable to retrieve your location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Using default location.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable. Using default location.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Using default location.';
          break;
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
    };

    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // Cache for 5 minutes
    });
  }, []);

  return state;
}
