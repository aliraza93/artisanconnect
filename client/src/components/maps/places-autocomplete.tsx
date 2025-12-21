import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { loadGoogleMaps } from "@/lib/google-maps";

interface PlacesAutocompleteProps {
  value: string;
  onChange: (address: string, lat: number | null, lng: number | null) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  disabled?: boolean;
  countryRestriction?: string; // ISO 3166-1 Alpha-2 country code (e.g., 'za' for South Africa)
}

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter an address",
  label,
  required = false,
  className,
  inputClassName,
  id = "places-autocomplete",
  disabled = false,
  countryRestriction = "za", // Default to South Africa
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState(value);

  // Sync external value to input when it changes (but don't interfere with typing)
  useEffect(() => {
    if (inputRef.current && value !== inputRef.current.value && !inputRef.current.matches(':focus')) {
      setInputValue(value);
      if (inputRef.current) {
        inputRef.current.value = value;
      }
    }
  }, [value]);

  useEffect(() => {
    // Load Google Maps API
    loadGoogleMaps()
      .then(() => {
        setIsLoaded(true);
        initializeAutocomplete();
      })
      .catch((err) => {
        console.error('Failed to load Google Maps:', err);
        setError("Google Maps failed to load. Please check your API key configuration.");
      });
  }, []);

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google) {
      console.error('Cannot initialize autocomplete: inputRef or Google Maps not available');
      return;
    }

    try {
      console.log('Initializing Google Places Autocomplete...');
      
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: countryRestriction ? { country: countryRestriction } : undefined,
          fields: ["formatted_address", "geometry", "name", "place_id"],
          types: ["address"],
        }
      );

      autocompleteRef.current = autocomplete;
      console.log('Google Places Autocomplete initialized successfully');

      // Handle place selection
      const handlePlaceSelect = () => {
        const place = autocomplete.getPlace();
        console.log('Place selected:', place);

        if (!place.geometry || !place.geometry.location) {
          console.warn('Place has no geometry');
          setError("No details available for this place");
          return;
        }

        setError(null);
        const address = place.formatted_address || place.name || "";
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setInputValue(address);
        onChange(address, lat, lng);
        onPlaceSelect?.(place);
      };

      autocomplete.addListener("place_changed", handlePlaceSelect);

      // Enhance dropdown items to ensure they're fully clickable
      const enhanceDropdownItems = () => {
        const pacContainer = document.querySelector('.pac-container') as HTMLElement;
        if (!pacContainer) return;

        // Ensure container has proper z-index and pointer events
        if (parseInt(pacContainer.style.zIndex || '0') < 9999) {
          pacContainer.style.zIndex = '9999';
        }
        pacContainer.style.pointerEvents = 'auto';
        
        // Prevent clicks on the dropdown from closing modals/dialogs
        // This is important because the dropdown is rendered outside the dialog
        const preventModalClose = (e: MouseEvent) => {
          e.stopPropagation();
        };
        
        pacContainer.addEventListener('mousedown', preventModalClose, true);
        pacContainer.addEventListener('click', preventModalClose, true);
        pacContainer.addEventListener('mouseup', preventModalClose, true);

        // Enhance each item to ensure clickability
        const pacItems = pacContainer.querySelectorAll('.pac-item');
        pacItems.forEach((item) => {
          const itemElement = item as HTMLElement;
          
          // Ensure cursor and pointer events
          itemElement.style.cursor = 'pointer';
          itemElement.style.pointerEvents = 'auto';
          
          // Ensure child elements don't block clicks
          const children = itemElement.querySelectorAll('*');
          children.forEach((child) => {
            (child as HTMLElement).style.pointerEvents = 'none';
          });
          
          // Add explicit click handler as backup (Google should handle it, but this ensures it works)
          const handleClick = (e: MouseEvent) => {
            // Stop propagation to prevent modal from closing
            e.stopPropagation();
            // Don't prevent default - let Google's handler work
          };
          
          // Remove old listener if exists and add new one
          itemElement.removeEventListener('click', handleClick);
          itemElement.addEventListener('click', handleClick, { passive: false });
          
          // Also prevent mousedown and mouseup from propagating
          const handleMouseDown = (e: MouseEvent) => {
            e.stopPropagation();
          };
          const handleMouseUp = (e: MouseEvent) => {
            e.stopPropagation();
          };
          
          itemElement.removeEventListener('mousedown', handleMouseDown);
          itemElement.removeEventListener('mouseup', handleMouseUp);
          itemElement.addEventListener('mousedown', handleMouseDown, { passive: false });
          itemElement.addEventListener('mouseup', handleMouseUp, { passive: false });
        });
      };

      // Watch for dropdown appearance with minimal interference
      const observer = new MutationObserver(() => {
        const hasPacContainer = document.querySelector('.pac-container');
        if (hasPacContainer) {
          // Small delay to let Google render
          setTimeout(enhanceDropdownItems, 10);
        }
      });

      // Watch input for when dropdown appears
      const input = inputRef.current;
      let inputHandler: (() => void) | null = null;

      if (input) {
        inputHandler = () => {
          setTimeout(enhanceDropdownItems, 50);
        };
        input.addEventListener('input', inputHandler);
      }

      // Observe document for pac-container
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Cleanup
      return () => {
        observer.disconnect();
        if (input && inputHandler) {
          input.removeEventListener('input', inputHandler);
        }
      };
    } catch (err) {
      console.error("Error initializing Google Places Autocomplete:", err);
      setError("Failed to initialize address autocomplete");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-base font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled || !isLoaded}
        className={cn("h-12 text-base", inputClassName)}
        data-testid={`input-${id}`}
        autoComplete="off"
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {!isLoaded && !error && (
        <p className="text-xs text-slate-400">Loading address suggestions...</p>
      )}
    </div>
  );
}

