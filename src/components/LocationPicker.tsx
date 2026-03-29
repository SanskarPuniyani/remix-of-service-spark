import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Search, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationPickerProps {
  initialLat?: number;
  initialLon?: number;
  fallbackCity?: string;
  onLocationSelect: (lat: number, lon: number, address?: string) => void;
  showSaveButton?: boolean;
  onSave?: (lat: number, lon: number, address?: string) => void;
}

// Component to handle map center updates
function ChangeView({ center, zoom }: { center: L.LatLngExpression; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Component to handle map click events
function MapEvents({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const LocationPicker = ({ initialLat, initialLon, fallbackCity, onLocationSelect, showSaveButton, onSave }: LocationPickerProps) => {
  const [position, setPosition] = useState<L.LatLngExpression | null>(
    initialLat && initialLon ? [initialLat, initialLon] : [19.0760, 72.8777]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [mapZoom, setMapZoom] = useState(13);
  const [currentAddress, setCurrentAddress] = useState<string>("");

  // Update position if initial coordinates change or geocode fallback city
  useEffect(() => {
    if (initialLat && initialLon) {
      setPosition([initialLat, initialLon]);
      setMapZoom(15);
    } else if (fallbackCity && !initialLat && !initialLon) {
      // Geocode fallback city if no coordinates
      const fetchCityCoords = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackCity)}&countrycodes=in&limit=1`
          );
          const data = await response.json();
          if (data && data[0]) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setPosition([lat, lon]);
            setMapZoom(12); // City level zoom
          }
        } catch (err) {
          console.error("City geocoding failed:", err);
        }
      };
      fetchCityCoords();
    }
  }, [initialLat, initialLon, fallbackCity]);

  // Real-time search as user types (limited to India)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=in&limit=5`
          );
          const data = await response.json();
          setSearchResults(data);
          setShowResults(true);
        } catch (err) {
          console.error("Search failed:", err);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const newPos: L.LatLngExpression = [lat, lon];
    setPosition(newPos);
    setSearchQuery(result.display_name);
    setCurrentAddress(result.display_name);
    setShowResults(false);
    onLocationSelect(lat, lon, result.display_name);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchResults.length > 0) {
      handleSelectResult(searchResults[0]);
    }
  };

  const handleMapClick = useCallback((lat: number, lon: number) => {
    setPosition([lat, lon]);
    onLocationSelect(lat, lon);
  }, [onLocationSelect]);

  const handleMarkerDragEnd = (e: L.DragEndEvent) => {
    const marker = e.target;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length > 2 && setShowResults(true)}
            placeholder="Search for a location or address..."
            className="w-full h-11 pl-10 pr-12 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
          />
        </form>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {showResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-[100] left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
            >
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-secondary transition-colors border-b border-border/50 last:border-0 flex items-start gap-3"
                >
                  <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="truncate">{result.display_name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-[400px] w-full rounded-2xl overflow-hidden border border-border relative z-0"
      >
        <MapContainer
          center={position || [19.0760, 72.8777]}
          zoom={13}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {position && (
            <>
              <ChangeView center={position} zoom={mapZoom} />
              <MapEvents onMapClick={handleMapClick} />
              <Marker 
                position={position} 
                draggable={true}
                eventHandlers={{ dragend: handleMarkerDragEnd }}
              />
            </>
          )}
        </MapContainer>
      </motion.div>
      {showSaveButton && onSave && position && (
        <button
          onClick={() => {
            const pos = position as [number, number];
            onSave(pos[0], pos[1], currentAddress || undefined);
          }}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" /> Save This Location
        </button>
      )}
      <p className="text-[10px] text-muted-foreground text-center italic">
        Tip: Drag the marker or click on the map to pinpoint your exact location.
      </p>
    </div>
  );
};
