import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Search, X, Compass, ExternalLink, Loader2, Check } from 'lucide-react';
import type { JournalLocation } from '../types';

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: JournalLocation) => void;
  currentLocation?: JournalLocation;
}

// Popular world reflection locations available as fallback / quick selection
const CURATED_LOCATIONS: JournalLocation[] = [
  {
    placeId: 'curated-kyoto',
    placeName: 'Kyoto',
    formattedAddress: 'Kyoto, Prefecture Kyoto, Japan',
    latitude: 35.0116,
    longitude: 135.7681,
  },
  {
    placeId: 'curated-paris',
    placeName: 'Paris',
    formattedAddress: 'Paris, Île-de-France, France',
    latitude: 48.8566,
    longitude: 2.3522,
  },
  {
    placeId: 'curated-sf',
    placeName: 'San Francisco',
    formattedAddress: 'San Francisco, CA, USA',
    latitude: 37.7749,
    longitude: -122.4194,
  },
  {
    placeId: 'curated-zurich',
    placeName: 'Zurich',
    formattedAddress: 'Zurich, Switzerland',
    latitude: 47.3769,
    longitude: 8.5417,
  },
  {
    placeId: 'curated-mumbai',
    placeName: 'Mumbai',
    formattedAddress: 'Mumbai, Maharashtra, India',
    latitude: 19.076,
    longitude: 72.8777,
  },
  {
    placeId: 'curated-reykjavik',
    placeName: 'Reykjavik',
    formattedAddress: 'Reykjavik, Capital Region, Iceland',
    latitude: 64.1466,
    longitude: -21.9426,
  },
  {
    placeId: 'curated-newyork',
    placeName: 'New York',
    formattedAddress: 'New York, NY, USA',
    latitude: 40.7128,
    longitude: -74.006,
  },
  {
    placeId: 'curated-tokyo',
    placeName: 'Tokyo',
    formattedAddress: 'Tokyo, Japan',
    latitude: 35.6762,
    longitude: 139.6503,
  },
];

interface AutocompleteItem {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  rawPrediction?: any;
}

// Sub-component that interacts with Google Places Library
const PlacesSearchContent: React.FC<{
  onSelectLocation: (loc: JournalLocation) => void;
  onClose: () => void;
  currentLocation?: JournalLocation;
  hasApiKey: boolean;
}> = ({ onSelectLocation, onClose, currentLocation, hasApiKey }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AutocompleteItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const placesLib = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');
  const sessionTokenRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input upon mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize session token when places library is ready
  useEffect(() => {
    if (placesLib?.AutocompleteSessionToken && !sessionTokenRef.current) {
      sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
    }
  }, [placesLib]);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // If no Google Maps API is loaded, fallback to filtering curated locations or local search
    if (!placesLib || !hasApiKey) {
      const filtered = CURATED_LOCATIONS.filter(
        (l) =>
          l.placeName.toLowerCase().includes(trimmed.toLowerCase()) ||
          l.formattedAddress.toLowerCase().includes(trimmed.toLowerCase())
      ).map((l) => ({
        placeId: l.placeId || l.placeName,
        primaryText: l.placeName,
        secondaryText: l.formattedAddress,
      }));

      // If user typed something custom not in curated list, offer it as a custom location
      if (filtered.length === 0) {
        filtered.push({
          placeId: `custom-${Date.now()}`,
          primaryText: trimmed,
          secondaryText: 'Custom Location (Coordinates will default to prime reflection coordinates)',
        });
      }

      setResults(filtered);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const timer = setTimeout(async () => {
      try {
        // Attempt Places API (New) AutocompleteSuggestion first
        if (placesLib.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
          const request = {
            input: trimmed,
            sessionToken: sessionTokenRef.current || undefined,
          };
          const response = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
          if (response.suggestions && response.suggestions.length > 0) {
            const mapped: AutocompleteItem[] = response.suggestions.map((s: any) => ({
              placeId: s.placePrediction?.placeId || Math.random().toString(),
              primaryText: s.placePrediction?.mainText?.text || s.placePrediction?.text?.text || trimmed,
              secondaryText: s.placePrediction?.secondaryText?.text || '',
              rawPrediction: s,
            }));
            setResults(mapped);
          } else {
            setResults([]);
          }
        } else if (placesLib.AutocompleteService) {
          // Fallback to legacy Maps JS AutocompleteService
          const service = new placesLib.AutocompleteService();
          service.getPlacePredictions(
            { input: trimmed, sessionToken: sessionTokenRef.current },
            (predictions, status) => {
              if (status === 'OK' && predictions) {
                const mapped = predictions.map((p) => ({
                  placeId: p.place_id,
                  primaryText: p.structured_formatting?.main_text || p.description,
                  secondaryText: p.structured_formatting?.secondary_text || '',
                }));
                setResults(mapped);
              } else {
                setResults([]);
              }
            }
          );
        }
      } catch (err: any) {
        console.warn('Place autocomplete lookup issue:', err);
        setErrorMsg('Places lookup encountered an issue. You can pick from curated locations below.');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, placesLib, hasApiKey]);

  // Handle selecting a prediction
  const handleSelect = async (item: AutocompleteItem) => {
    setIsLoading(true);

    // If it's a curated location
    const curatedMatch = CURATED_LOCATIONS.find((c) => c.placeId === item.placeId || c.placeName === item.primaryText);
    if (curatedMatch) {
      onSelectLocation(curatedMatch);
      onClose();
      return;
    }

    // Try fetching place details via Google Places Library
    if (placesLib) {
      try {
        if (item.rawPrediction?.placePrediction?.toPlace) {
          const place = item.rawPrediction.placePrediction.toPlace();
          await place.fetchFields({
            fields: ['id', 'displayName', 'formattedAddress', 'location'],
          });

          const loc: JournalLocation = {
            placeId: place.id || item.placeId,
            placeName: place.displayName || item.primaryText,
            formattedAddress: place.formattedAddress || item.secondaryText || item.primaryText,
            latitude: typeof place.location?.lat === 'function' ? place.location.lat() : Number(place.location?.lat) || 0,
            longitude: typeof place.location?.lng === 'function' ? place.location.lng() : Number(place.location?.lng) || 0,
          };
          onSelectLocation(loc);
          onClose();
          return;
        }

        // Try geocoding if places details are not direct
        if (geocodingLib?.Geocoder) {
          const geocoder = new geocodingLib.Geocoder();
          geocoder.geocode({ address: `${item.primaryText} ${item.secondaryText}`.trim() }, (res, status) => {
            if (status === 'OK' && res && res[0]?.geometry?.location) {
              const gLoc = res[0].geometry.location;
              const loc: JournalLocation = {
                placeId: item.placeId,
                placeName: item.primaryText,
                formattedAddress: res[0].formatted_address || `${item.primaryText}, ${item.secondaryText}`,
                latitude: gLoc.lat(),
                longitude: gLoc.lng(),
              };
              onSelectLocation(loc);
              onClose();
            } else {
              // Fallback
              onSelectLocation({
                placeId: item.placeId,
                placeName: item.primaryText,
                formattedAddress: item.secondaryText || item.primaryText,
                latitude: 20.0,
                longitude: 0.0,
              });
              onClose();
            }
          });
          return;
        }
      } catch (err) {
        console.warn('Could not fetch place fields:', err);
      }
    }

    // Safe fallback for custom location
    onSelectLocation({
      placeId: item.placeId,
      placeName: item.primaryText,
      formattedAddress: item.secondaryText ? `${item.primaryText}, ${item.secondaryText}` : item.primaryText,
      latitude: 0,
      longitude: 0,
    });
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Input Bar */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city, neighborhood, or landmark..."
          className="w-full pl-10 pr-10 py-2.5 bg-[#131724] border border-white/[0.12] rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-hidden focus:border-violet-500/70 transition-all font-sans"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-center space-x-2 py-3 px-3 text-xs text-violet-300">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Searching places...</span>
        </div>
      )}

      {/* Error / Fallback Notice */}
      {errorMsg && (
        <div className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/40 rounded-xl p-2.5 mb-3">
          {errorMsg}
        </div>
      )}

      {/* Places / Results List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-60 sm:max-h-72">
        {results.length > 0 ? (
          results.map((item) => (
            <button
              key={item.placeId}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-white/[0.06] flex items-start space-x-3 transition-colors group cursor-pointer border border-transparent hover:border-white/[0.08]"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-300 mt-0.5 shrink-0 group-hover:scale-105 transition-transform">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-white truncate">
                  {item.primaryText}
                </p>
                {item.secondaryText && (
                  <p className="text-[11px] text-slate-400 truncate">{item.secondaryText}</p>
                )}
              </div>
            </button>
          ))
        ) : query.trim() && !isLoading ? (
          <div className="py-6 text-center text-xs text-slate-400">
            <p>No places found matching &ldquo;{query}&rdquo;.</p>
            <button
              onClick={() =>
                handleSelect({
                  placeId: `custom-${Date.now()}`,
                  primaryText: query.trim(),
                  secondaryText: 'Custom Location',
                })
              }
              className="mt-2 text-violet-400 hover:text-violet-300 underline cursor-pointer"
            >
              Use &ldquo;{query.trim()}&rdquo; as custom location
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono-meta font-semibold text-slate-400 uppercase tracking-wider px-1 pt-1">
              <span className="flex items-center space-x-1.5">
                <Compass className="w-3 h-3 text-violet-400" />
                <span>Curated Reflection Hubs</span>
              </span>
              <span className="text-[10px] text-slate-500">Quick Select</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CURATED_LOCATIONS.map((loc) => {
                const isCurrent = currentLocation?.placeName === loc.placeName;
                return (
                  <button
                    key={loc.placeId}
                    onClick={() => {
                      onSelectLocation(loc);
                      onClose();
                    }}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-violet-950/40 border-violet-500/50 text-white'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.07] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-semibold truncate">{loc.placeName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{loc.formattedAddress.split(',')[1] || loc.formattedAddress}</p>
                      </div>
                    </div>
                    {isCurrent && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Maps API Key status footer note */}
      {!hasApiKey && (
        <div className="mt-4 pt-3 border-t border-white/[0.07] text-[11px] text-slate-400 flex items-center justify-between">
          <span>Google Maps API key not yet set in environment.</span>
          <a
            href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 inline-flex items-center space-x-1 underline"
          >
            <span>Get Free Demo Key</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      )}
    </div>
  );
};

export const LocationSearchModal: React.FC<LocationSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  currentLocation,
}) => {
  if (!isOpen) return null;

  const mapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const hasApiKey = Boolean(mapsApiKey && mapsApiKey.trim() !== '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-location-title"
    >
      <div
        className="bg-[#0f121d] border border-white/[0.12] rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <MapPin className="w-4 h-4 text-violet-300" />
            </div>
            <div>
              <h3 id="modal-location-title" className="text-sm sm:text-base font-display font-bold text-white">
                Associate Location
              </h3>
              <p className="text-[11px] text-slate-400">Anchor this reflection to a physical coordinate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/[0.04] text-slate-400 hover:text-white border border-white/[0.08] cursor-pointer"
            aria-label="Close location search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Wrap with APIProvider if API key exists */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {hasApiKey ? (
            <APIProvider
              apiKey={mapsApiKey}
              solutionChannel="gmp_mcp_codeassist_v1_aistudio"
            >
              <PlacesSearchContent
                onSelectLocation={onSelectLocation}
                onClose={onClose}
                currentLocation={currentLocation}
                hasApiKey={hasApiKey}
              />
            </APIProvider>
          ) : (
            <PlacesSearchContent
              onSelectLocation={onSelectLocation}
              onClose={onClose}
              currentLocation={currentLocation}
              hasApiKey={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};
