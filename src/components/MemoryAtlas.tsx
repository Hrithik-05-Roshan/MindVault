import React, { useState, useMemo, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Compass,
  Calendar,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Search,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import type { JournalEntry, UserProfile } from '../types';

interface MemoryAtlasProps {
  user: UserProfile;
  entries: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  onNavigateToJournal: () => void;
  onNewEntry?: () => void;
}

// Controller to smoothly pan/zoom the map to a target coordinate
const MapController: React.FC<{
  targetLocation: { lat: number; lng: number } | null;
}> = ({ targetLocation }) => {
  const map = useMap();

  React.useEffect(() => {
    if (!map || !targetLocation) return;
    map.panTo(targetLocation);
    map.setZoom(12);
  }, [map, targetLocation]);

  return null;
};

export const MemoryAtlas: React.FC<MemoryAtlasProps> = ({
  entries,
  onSelectEntry,
  onNavigateToJournal,
  onNewEntry,
}) => {
  const mapsApiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  const hasApiKey = Boolean(mapsApiKey && mapsApiKey.trim() !== '');

  // Filter entries to only those with valid geographic coordinates
  const locationEntries = useMemo(() => {
    return entries.filter(
      (e) =>
        e.location &&
        typeof e.location.latitude === 'number' &&
        typeof e.location.longitude === 'number' &&
        !isNaN(e.location.latitude) &&
        !isNaN(e.location.longitude)
    );
  }, [entries]);

  // Selected entry for InfoWindow and focus
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [activePanLocation, setActivePanLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filtered entries for search in sidebar
  const filteredLocationEntries = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return locationEntries;
    return locationEntries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.location?.placeName.toLowerCase().includes(q) ||
        e.location?.formattedAddress.toLowerCase().includes(q) ||
        (e.mood && e.mood.toLowerCase().includes(q))
    );
  }, [locationEntries, searchFilter]);

  // Compute default center
  const defaultCenter = useMemo(() => {
    if (locationEntries.length > 0 && locationEntries[0].location) {
      return {
        lat: locationEntries[0].location.latitude,
        lng: locationEntries[0].location.longitude,
      };
    }
    return { lat: 20, lng: 0 };
  }, [locationEntries]);

  const handleSelectMarker = useCallback((entry: JournalEntry) => {
    setSelectedEntry(entry);
    if (entry.location) {
      setActivePanLocation({
        lat: entry.location.latitude,
        lng: entry.location.longitude,
      });
    }
  }, []);

  const handleViewFullEntry = useCallback(
    (entry: JournalEntry) => {
      onSelectEntry(entry);
      onNavigateToJournal();
    },
    [onSelectEntry, onNavigateToJournal]
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden text-slate-100 relative">
      {/* Top Banner & Header */}
      <div className="bg-[#0e111a]/85 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/[0.08] shadow-xl p-3.5 sm:p-4 mb-3 flex flex-wrap items-center justify-between gap-3 shrink-0 mx-3 sm:mx-4 mt-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#141824] border border-white/[0.12] flex items-center justify-center text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Compass className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-tight">
                Memory Atlas
              </h2>
              <span className="text-[11px] font-mono-meta font-semibold px-2 py-0.5 rounded-full bg-violet-950/60 text-violet-300 border border-violet-500/30">
                {locationEntries.length} {locationEntries.length === 1 ? 'Location Memory' : 'Location Memories'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive geographic visualization of your reflections anchored in space and time
            </p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center space-x-2">
          {onNewEntry && (
            <button
              id="btn-atlas-new-reflection"
              onClick={() => {
                onNewEntry();
                onNavigateToJournal();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600/90 to-indigo-600/90 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer flex items-center space-x-1.5 active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Write Reflection</span>
            </button>
          )}

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors border border-white/[0.08] cursor-pointer"
            title={isSidebarCollapsed ? 'Show Memories List' : 'Hide Memories List'}
            aria-label="Toggle atlas list"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden px-3 sm:px-4 pb-3 sm:pb-4 gap-3 relative">
        {/* Left Side: Location Memories Explorer Sidebar */}
        <div
          className={`bg-[#0e111a]/85 backdrop-blur-xl rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-10 ${
            isSidebarCollapsed
              ? 'w-0 p-0 opacity-0 pointer-events-none hidden lg:block'
              : 'w-full lg:w-80 xl:w-96 shrink-0'
          }`}
        >
          {/* Search bar within sidebar */}
          <div className="p-3 border-b border-white/[0.07] bg-[#121623]/80 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter memories by place, title, mood..."
                className="w-full pl-8 pr-7 py-1.5 bg-[#161a29] border border-white/[0.08] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-violet-500/60"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* List of location memories */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {locationEntries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-violet-950/50 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-display font-bold text-white">No location memories yet</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Add a location to any journal entry in the editor and your memories will appear plotted here in your personal Memory Atlas.
                  </p>
                </div>
                <button
                  onClick={onNavigateToJournal}
                  className="mt-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all cursor-pointer shadow-md"
                >
                  Go to Journal
                </button>
              </div>
            ) : filteredLocationEntries.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No location memories matched &ldquo;{searchFilter}&rdquo;.
              </div>
            ) : (
              filteredLocationEntries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={entry.id}
                    onClick={() => handleSelectMarker(entry)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer text-left group ${
                      isSelected
                        ? 'bg-violet-950/40 border-violet-500/60 shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                        : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.07]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span className="text-xs font-semibold text-white truncate">
                          {entry.location?.placeName || 'Saved Location'}
                        </span>
                      </div>
                      {entry.mood && (
                        <span className="text-[10px] font-mono-meta font-medium px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 shrink-0">
                          {entry.mood}
                        </span>
                      )}
                    </div>

                    <h5 className="text-xs font-medium text-slate-200 group-hover:text-violet-200 transition-colors truncate">
                      {entry.title || 'Untitled Reflection'}
                    </h5>

                    {entry.location?.formattedAddress && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {entry.location.formattedAddress}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/[0.05] text-[10px] text-slate-500 font-mono-meta">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formattedDate}</span>
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewFullEntry(entry);
                        }}
                        className="text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center space-x-1 group/btn cursor-pointer"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-2.5 h-2.5 group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Map Canvas Container */}
        <div className="flex-1 bg-[#0b0e17] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden relative flex flex-col">
          {hasApiKey ? (
            <div className="w-full h-full relative">
              <APIProvider
                apiKey={mapsApiKey}
                solutionChannel="gmp_mcp_codeassist_v1_aistudio"
              >
                <Map
                  mapId="DEMO_MAP_ID"
                  defaultCenter={defaultCenter}
                  defaultZoom={locationEntries.length > 0 ? 3 : 2}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  className="w-full h-full"
                >
                  <MapController targetLocation={activePanLocation} />

                  {/* Render pins for each location-aware memory */}
                  {locationEntries.map((entry) => {
                    if (!entry.location) return null;
                    const isSelected = selectedEntry?.id === entry.id;

                    return (
                      <AdvancedMarker
                        key={entry.id}
                        position={{
                          lat: entry.location.latitude,
                          lng: entry.location.longitude,
                        }}
                        onClick={() => handleSelectMarker(entry)}
                        title={entry.title}
                      >
                        <Pin
                          background={isSelected ? '#a855f7' : '#7c3aed'}
                          borderColor={isSelected ? '#ffffff' : '#c4b5fd'}
                          glyphColor="#ffffff"
                          scale={isSelected ? 1.2 : 1.0}
                        />
                      </AdvancedMarker>
                    );
                  })}

                  {/* InfoWindow for the clicked reflection */}
                  {selectedEntry && selectedEntry.location && (
                    <InfoWindow
                      position={{
                        lat: selectedEntry.location.latitude,
                        lng: selectedEntry.location.longitude,
                      }}
                      onCloseClick={() => setSelectedEntry(null)}
                      headerContent={
                        <div className="font-display font-bold text-slate-900 text-xs sm:text-sm">
                          {selectedEntry.location.placeName || 'Reflection Location'}
                        </div>
                      }
                    >
                      <div className="p-1 max-w-[240px] text-slate-800 space-y-1.5">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {selectedEntry.title}
                        </div>
                        {selectedEntry.location.formattedAddress && (
                          <div className="text-[11px] text-slate-600 line-clamp-2">
                            {selectedEntry.location.formattedAddress}
                          </div>
                        )}
                        {selectedEntry.content && (
                          <div className="text-[11px] text-slate-700 line-clamp-3 italic pt-1 border-t border-slate-200">
                            &ldquo;{selectedEntry.content.slice(0, 160)}&rdquo;
                          </div>
                        )}
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">
                            {new Date(selectedEntry.createdAt).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => handleViewFullEntry(selectedEntry)}
                            className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            Open Entry
                          </button>
                        </div>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            </div>
          ) : (
            // Graceful degradation when Google Maps API key is not yet configured
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-radial from-[#121626] to-[#07090e]">
              <div className="w-16 h-16 rounded-3xl bg-violet-950/60 border border-violet-500/30 flex items-center justify-center text-violet-300 mb-4 shadow-[0_0_30px_rgba(139,92,246,0.25)]">
                <Compass className="w-8 h-8 text-violet-400" />
              </div>

              <h3 className="text-lg sm:text-xl font-display font-bold text-white mb-2">
                Memory Atlas Ready for Google Maps
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
                Connect your Google Maps Platform key to render high-resolution vector tiles and advanced markers. Your location-aware entries are already safely organized and ready to be plotted.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-md flex items-center space-x-2 cursor-pointer"
                >
                  <span>Get Free Maps Demo Key</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={onNavigateToJournal}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] font-semibold text-xs transition-all cursor-pointer"
                >
                  Return to Journal
                </button>
              </div>

              {/* Plotted memories preview summary even without live map tiles */}
              {locationEntries.length > 0 && (
                <div className="mt-8 w-full max-w-lg bg-[#0e121d]/80 border border-white/[0.08] rounded-2xl p-4 text-left">
                  <div className="flex items-center justify-between text-xs font-mono-meta text-slate-400 mb-3">
                    <span className="flex items-center space-x-1.5 text-violet-400 font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>{locationEntries.length} Anchored Reflections</span>
                    </span>
                    <span>Ready to Display</span>
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {locationEntries.slice(0, 4).map((e) => (
                      <div
                        key={e.id}
                        onClick={() => handleViewFullEntry(e)}
                        className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="truncate">
                          <p className="text-xs font-semibold text-white truncate">{e.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{e.location?.placeName}</p>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
