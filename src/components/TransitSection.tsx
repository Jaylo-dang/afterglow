import React, { useState, useEffect, useMemo } from 'react';
import { Mode, NearestSpotItem, NearestApiResponse, ArrivalsApiResponse } from '../types';
import {
  Navigation,
  Search,
  MapPin,
  Bus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
  Clock,
  Accessibility
} from 'lucide-react';

interface TransitSectionProps {
  mode: Mode;
}

export function TransitSection({ mode }: TransitSectionProps) {
  // Geolocation & spots state
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'requesting' | 'found' | 'refused' | 'timeout' | 'error'
  >('idle');
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [spots, setSpots] = useState<NearestSpotItem[]>([]);
  const [spotsLoading, setSpotsLoading] = useState<boolean>(true);
  const [spotsFetchedAt, setSpotsFetchedAt] = useState<string | null>(null);
  const [spotsSource, setSpotsSource] = useState<string>('LTA DataMall');
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [spotsError, setSpotsError] = useState<{
    status?: number;
    reference?: string;
    message: string;
  } | null>(null);

  // Search filter (local in-browser filtering, no request on keystroke)
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Expanded spot for live arrivals inspection
  const [selectedSpotName, setSelectedSpotName] = useState<string | null>(null);

  // Live arrivals state per bus stop
  const [arrivalsLoading, setArrivalsLoading] = useState<boolean>(false);
  const [arrivalsData, setArrivalsData] = useState<ArrivalsApiResponse | null>(null);
  const [arrivalsError, setArrivalsError] = useState<{
    status?: number;
    reference?: string;
    message: string;
  } | null>(null);

  // Fetch nearest spots (with or without user coordinates)
  const fetchSpots = async (coords?: { lat: number; lon: number } | null) => {
    setSpotsLoading(true);
    setSpotsError(null);
    try {
      let url = '/api/nearest';
      if (coords) {
        url += `?lat=${encodeURIComponent(coords.lat)}&lon=${encodeURIComponent(coords.lon)}`;
      }
      const res = await fetch(url);
      const data: NearestApiResponse = await res.json();
      if (!res.ok) {
        setSpotsError({
          status: res.status,
          reference: data.reference || `HTTP-${res.status}`,
          message: data.message || 'Failed to calculate nearest shooting spots.'
        });
      } else {
        setSpots(data.spots || []);
        setSpotsFetchedAt(data.fetchedAt || null);
        setSpotsSource(data.source || 'LTA DataMall');
        setUsingFallback(Boolean(data.usingFallback));
        setFallbackReason(data.fallbackReason || null);
      }
    } catch {
      setSpotsError({
        status: 502,
        reference: 'NET-502',
        message: 'Could not connect to the nearest spots service. Check your connection.'
      });
    } finally {
      setSpotsLoading(false);
    }
  };

  // Initial load: fetch spots with default order
  useEffect(() => {
    fetchSpots(null);
  }, []);

  // Request browser geolocation
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('refused');
      return;
    }

    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setUserCoords(coords);
        setLocationStatus('found');
        fetchSpots(coords);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('refused');
        } else if (error.code === error.TIMEOUT) {
          setLocationStatus('timeout');
        } else {
          setLocationStatus('error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Fetch live bus arrivals for a stop code
  const fetchArrivals = async (stopCode: string) => {
    setArrivalsLoading(true);
    setArrivalsError(null);
    setArrivalsData(null);
    try {
      const res = await fetch(`/api/arrivals?stopCode=${encodeURIComponent(stopCode)}`, {
        cache: 'no-store'
      });
      const data: ArrivalsApiResponse = await res.json();

      if (!res.ok) {
        setArrivalsError({
          status: res.status,
          reference: data.reference || `REF-${res.status}`,
          message: data.message || 'Live bus arrivals could not be loaded.'
        });
      } else {
        setArrivalsData(data);
      }
    } catch {
      setArrivalsError({
        status: 502,
        reference: 'NET-502',
        message: 'LTA DataMall service could not be reached.'
      });
    } finally {
      setArrivalsLoading(false);
    }
  };

  // Toggle spot expansion
  const handleToggleSpot = (spot: NearestSpotItem) => {
    if (selectedSpotName === spot.name) {
      setSelectedSpotName(null);
      setArrivalsData(null);
      setArrivalsError(null);
    } else {
      setSelectedSpotName(spot.name);
      fetchArrivals(spot.nearestBusStop.code);
    }
  };

  // In-browser text filtering for spots
  const filteredSpots = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return spots;
    return spots.filter(
      (spot) =>
        spot.name.toLowerCase().includes(term) ||
        spot.nearestBusStop.name.toLowerCase().includes(term) ||
        spot.nearestBusStop.road.toLowerCase().includes(term)
    );
  }, [spots, searchTerm]);

  // Format ISO timestamp in friendly readable words without timezone conversion confusion
  const formatFriendlyTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('en-SG', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  return (
    <section
      id="transit-guide-section"
      className="bg-white/95 border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-stone-200/60 backdrop-blur-sm mt-8 transition-colors duration-400"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Navigation
              className={`w-5 h-5 transition-colors duration-400 ${
                mode === 'sunset' ? 'text-orange-600' : 'text-rose-500'
              }`}
            />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Getting to the Spots
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 font-normal">
            Find the nearest photography vantage point from where you are, with live bus connections from LTA DataMall
          </p>
        </div>

        {/* Location Action Button */}
        <div className="flex items-center gap-2">
          <button
            id="locate-me-button"
            type="button"
            onClick={handleRequestLocation}
            disabled={locationStatus === 'requesting'}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              mode === 'sunset'
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white hover:opacity-95'
                : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white hover:opacity-95'
            } disabled:opacity-50`}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span>
              {locationStatus === 'requesting'
                ? 'Finding your location...'
                : locationStatus === 'found'
                ? 'Location active (Click to refresh)'
                : 'Find nearest spot to me'}
            </span>
          </button>
        </div>
      </div>

      {/* Geolocation status banners */}
      {locationStatus === 'refused' && (
        <div
          id="location-refused-banner"
          className="mb-6 p-4 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 text-xs sm:text-sm flex items-start gap-3"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Location permission was not granted.</span> No problem — you can browse all five spots below or use the search box to find your favourite location.
          </div>
        </div>
      )}

      {locationStatus === 'timeout' && (
        <div
          id="location-timeout-banner"
          className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3"
        >
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Location request timed out.</span> Please try tapping again or filter spots below by name.
          </div>
        </div>
      )}

      {locationStatus === 'found' && (
        <div
          id="location-found-banner"
          className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Showing spots ranked by distance from your current position.</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 font-medium">Nearest first</span>
        </div>
      )}

      {/* Visible Fallback Notice when live LTA bus stop data could not be reached */}
      {usingFallback && !spotsLoading && !spotsError && (
        <div
          id="bus-stops-fallback-banner"
          className="mb-6 p-4 rounded-xl bg-amber-50/90 border-2 border-dashed border-amber-400 text-amber-950 text-xs sm:text-sm shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900">
                Notice: Live bus stop data could not be reached.
              </p>
              <p className="text-amber-800 leading-relaxed">
                These stop details come from a list built into the app rather than live from LTA DataMall
                {spotsFetchedAt ? ` (attempted at ${formatFriendlyTime(spotsFetchedAt)})` : ''}.
                {fallbackReason ? ` Reason: ${fallbackReason}` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Spot Filter Search Box */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="spot-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter spots by name, landmark, or bus stop..."
            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 outline-none focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 font-semibold px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Spots list loading state */}
      {spotsLoading && (
        <div className="py-12 text-center">
          <div
            className={`inline-block w-8 h-8 border-2 rounded-full animate-spin mb-3 ${
              mode === 'sunset' ? 'border-orange-500/30 border-t-orange-600' : 'border-rose-400/30 border-t-rose-500'
            }`}
          />
          <p className="text-sm font-semibold text-stone-800">
            Calculating transit connections for Singapore shooting spots...
          </p>
        </div>
      )}

      {/* Spots list error */}
      {!spotsLoading && spotsError && (
        <div className="p-5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs sm:text-sm mb-6">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Could not load nearest spots (Reference: {spotsError.reference})</span>
          </div>
          <p>{spotsError.message}</p>
        </div>
      )}

      {/* Spot Cards */}
      {!spotsLoading && !spotsError && (
        <div className="space-y-4">
          {filteredSpots.map((spot, index) => {
            const isExpanded = selectedSpotName === spot.name;
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}&travelmode=transit`;

            return (
              <div
                key={spot.name}
                id={`nearest-spot-card-${index}`}
                className={`border rounded-xl transition-all overflow-hidden bg-white ${
                  isExpanded
                    ? mode === 'sunset'
                      ? 'border-orange-400 ring-2 ring-orange-500/20 shadow-md'
                      : 'border-rose-400 ring-2 ring-rose-500/20 shadow-md'
                    : 'border-stone-200/90 hover:border-stone-300 shadow-sm'
                }`}
              >
                {/* Spot Header Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-stone-900">{spot.name}</h3>
                      <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700">
                        Facing {spot.facing}
                      </span>
                      {spot.distanceFromUserKm !== null && (
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            mode === 'sunset'
                              ? 'bg-amber-50 text-orange-900 border-amber-300'
                              : 'bg-rose-50 text-rose-900 border-rose-300'
                          }`}
                        >
                          {spot.distanceFromUserKm.toFixed(1)} km away
                        </span>
                      )}
                    </div>

                    {/* Nearest Bus Stop Information */}
                    <div className="mt-2 text-xs text-stone-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="inline-flex items-center gap-1 font-semibold text-stone-800">
                        <Bus className="w-3.5 h-3.5 text-stone-500" />
                        <span>Nearest Bus Stop:</span>
                      </span>
                      <span className="font-semibold text-stone-900">{spot.nearestBusStop.name}</span>
                      <span className="text-stone-300">•</span>
                      <span>{spot.nearestBusStop.road}</span>
                      <span className="text-stone-300">•</span>
                      <span className="font-mono bg-stone-100 px-1.5 py-0.2 rounded border border-stone-200 text-stone-700">
                        Code {spot.nearestBusStop.code}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="text-stone-500 font-medium">
                        ~{spot.nearestBusStop.metresFromSpot}m walk to vantage
                      </span>
                      {spot.nearestBusStop.source === 'built-in fallback list' ? (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded">
                            Built-in fallback
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
                            LTA Live
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions: Directions & Expand Live Arrivals */}
                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <a
                      id={`directions-link-${index}`}
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-800 bg-stone-50 hover:bg-stone-100 transition-colors shadow-sm"
                    >
                      <span>Directions</span>
                      <ExternalLink className="w-3 h-3 text-stone-500" />
                    </a>

                    <button
                      id={`toggle-arrivals-btn-${index}`}
                      type="button"
                      onClick={() => handleToggleSpot(spot)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                        isExpanded
                          ? mode === 'sunset'
                            ? 'bg-orange-600 text-white'
                            : 'bg-rose-500 text-white'
                          : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200'
                      }`}
                    >
                      <span>{isExpanded ? 'Hide Buses' : 'Live Buses'}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Live Arrivals Section */}
                {isExpanded && (
                  <div className="border-t border-stone-200 bg-stone-50/70 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-200/80">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-stone-900">
                            Live Arrivals at {spot.nearestBusStop.name} (Stop {spot.nearestBusStop.code})
                          </h4>
                          <button
                            type="button"
                            onClick={() => fetchArrivals(spot.nearestBusStop.code)}
                            disabled={arrivalsLoading}
                            title="Refresh arrivals"
                            className="text-stone-500 hover:text-stone-800 transition-colors p-1"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 ${arrivalsLoading ? 'animate-spin' : ''}`}
                            />
                          </button>
                        </div>
                        {arrivalsData?.fetchedAt && (
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            As of {formatFriendlyTime(arrivalsData.fetchedAt)} • Source: {arrivalsData.source || 'LTA DataMall'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* State: Loading Arrivals */}
                    {arrivalsLoading && (
                      <div className="py-8 text-center">
                        <div
                          className={`inline-block w-6 h-6 border-2 rounded-full animate-spin mb-2 ${
                            mode === 'sunset'
                              ? 'border-orange-500/30 border-t-orange-600'
                              : 'border-rose-400/30 border-t-rose-500'
                          }`}
                        />
                        <p className="text-xs text-stone-600 font-medium">
                          Contacting LTA DataMall for bus arrival times...
                        </p>
                      </div>
                    )}

                    {/* State: Arrivals Unavailable / Upstream Error */}
                    {!arrivalsLoading && arrivalsError && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 font-bold mb-1">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Arrivals Unavailable (Ref: {arrivalsError.reference})</span>
                        </div>
                        <p>{arrivalsError.message}</p>
                        <p className="text-xs text-stone-600 mt-2">
                          You can still tap "Directions" above to view full Google Maps transit route options.
                        </p>
                      </div>
                    )}

                    {/* State: No Buses Due (200 with empty list flag) */}
                    {!arrivalsLoading && !arrivalsError && arrivalsData?.noBusesDue && (
                      <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 text-center text-xs sm:text-sm text-stone-700">
                        <p className="font-semibold text-stone-900">
                          No buses currently scheduled or operating at this stop.
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          Services may have concluded for the evening or are between operating schedules.
                        </p>
                      </div>
                    )}

                    {/* State: Live Services List */}
                    {!arrivalsLoading &&
                      !arrivalsError &&
                      arrivalsData &&
                      !arrivalsData.noBusesDue &&
                      (arrivalsData.services || []).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {arrivalsData.services!.map((svc) => (
                            <div
                              key={svc.serviceNo}
                              className="bg-white border border-stone-200 rounded-xl p-3.5 shadow-sm flex flex-col justify-between"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-1 rounded-lg text-sm font-extrabold font-mono text-white ${
                                      mode === 'sunset' ? 'bg-orange-600' : 'bg-rose-500'
                                    }`}
                                  >
                                    {svc.serviceNo}
                                  </span>
                                  <span className="text-[11px] font-semibold text-stone-600">
                                    {svc.nextBus.busType}
                                  </span>
                                </div>

                                <div className="text-right">
                                  <span
                                    className={`text-base font-extrabold font-mono ${
                                      svc.nextBus.arrival === 'Arriving'
                                        ? 'text-emerald-600 animate-pulse'
                                        : 'text-stone-900'
                                    }`}
                                  >
                                    {svc.nextBus.arrival}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600">
                                <span className="font-medium">{svc.nextBus.load}</span>
                                {svc.nextBus.feature === 'Wheelchair accessible' && (
                                  <span className="inline-flex items-center gap-0.5 text-stone-500" title="Wheelchair accessible">
                                    <Accessibility className="w-3 h-3" />
                                    <span>WAB</span>
                                  </span>
                                )}
                              </div>

                              {svc.subsequentBuses && svc.subsequentBuses.length > 0 && (
                                <div className="mt-1 text-[10px] text-stone-400 font-mono">
                                  Next: {svc.subsequentBuses.join(' • ')}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredSpots.length === 0 && (
            <div className="p-8 text-center text-xs sm:text-sm text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
              No shooting spots found matching "{searchTerm}". Try clearing your search.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
