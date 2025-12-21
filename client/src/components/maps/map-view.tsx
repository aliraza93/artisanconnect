import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { loadGoogleMaps } from "@/lib/google-maps";

interface MapViewProps {
  latitude: number;
  longitude: number;
  address?: string;
  zoom?: number;
  className?: string;
  height?: string;
  showMarker?: boolean;
  markerTitle?: string;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

export function MapView({
  latitude,
  longitude,
  address,
  zoom = 15,
  className,
  height = "400px",
  showMarker = true,
  markerTitle,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Google Maps API
    loadGoogleMaps()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setError(err.message || "Google Maps failed to load. Please check your API key configuration.");
      });
  }, []);
  
  useEffect(() => {
    if (isLoaded && window.google) {
      initializeMap();
    }
  }, [isLoaded, latitude, longitude, zoom]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      const location = { lat: latitude, lng: longitude };

      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        center: location,
        zoom: zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;

      // Add marker if requested
      if (showMarker) {
        const marker = new window.google.maps.Marker({
          position: location,
          map: map,
          title: markerTitle || address || "Location",
          animation: window.google.maps.Animation.DROP,
        });

        markerRef.current = marker;

        // Add info window if address is provided
        if (address) {
          const infoWindow = new window.google.maps.InfoWindow({
            content: `<div style="padding: 8px;"><strong>${address}</strong></div>`,
          });

          marker.addListener("click", () => {
            infoWindow.open(map, marker);
          });
        }
      }
    } catch (err) {
      console.error("Error initializing Google Map:", err);
      setError("Failed to load map");
    }
  };

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200",
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200",
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-slate-400">Loading map...</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={cn("rounded-lg overflow-hidden border border-slate-200", className)}
      style={{ height }}
    />
  );
}

