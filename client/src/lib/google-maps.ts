/**
 * Google Maps API loader
 * Loads the Google Maps JavaScript API dynamically
 */

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

let isLoaded = false;
let isLoading = false;
const loadCallbacks: Array<() => void> = [];

export function loadGoogleMaps(): Promise<void> {
  return new Promise((resolve, reject) => {
    // If already loaded, resolve immediately
    if (isLoaded && window.google && window.google.maps) {
      resolve();
      return;
    }

    // If currently loading, add to callbacks
    if (isLoading) {
      loadCallbacks.push(() => resolve());
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[data-google-maps]');
    if (existingScript) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          isLoaded = true;
          resolve();
          loadCallbacks.forEach(cb => cb());
          loadCallbacks.length = 0;
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (!isLoaded) {
          reject(new Error('Google Maps failed to load'));
        }
      }, 10000);
      return;
    }

    // Start loading
    isLoading = true;

    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('VITE_GOOGLE_MAPS_API_KEY not set. Google Maps features will not work.');
      isLoading = false;
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-maps', 'true');
    
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      isLoading = false;
      const error = new Error('Failed to load Google Maps API');
      reject(error);
      loadCallbacks.forEach(() => {
        // Reject all pending callbacks
      });
      loadCallbacks.length = 0;
    };

    document.head.appendChild(script);
  });
}

// Auto-load on module import if in browser
if (typeof window !== 'undefined') {
  // Don't auto-load, let components load it when needed
}

