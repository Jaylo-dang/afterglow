import React, { useState, useEffect, useMemo } from 'react';
import { Mode, SpotItem, NearestSpotItem, NearestApiResponse, ArrivalsApiResponse } from '../types';
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
  Accessibility,
  Eye,
  EyeOff
} from 'lucide-react';

interface TransitSectionProps {
  mode: Mode;
  forecastSpots?: SpotItem[];
  selectedDate?: string;
}

type LocationStatus = 'idle' | 'asking' | 'granted' | 'refused' | 'timeout' | 'unavailable';

// Haversine formula to calculate straight-line distance in metres between two GPS coordinates
function haversineMetres(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function TransitSection({ mode, forecastSpots, selectedDate }: TransitSectionProps) {
  // Geolocation & spots state
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [locationReadAt, setLocationReadAt] = useState<Date | null>(null);
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

  // Search filter (local in-browser filtering: spot name, bus stop name, and road name)
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Sunset / Sunrise facing control
  const targetFacing = mode === 'sunset' ? 'west' : 'east';
  const oppositeFacing = mode === 'sunset' ? 'east' : 'west';
  const [showOppositeFacing, setShowOppositeFacing] = useState<boolean>(false);

  // Reset showOppositeFacing when mode switches
  useEffect(() => {
    setShowOppositeFacing(false);
  }, [mode]);

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

  // Initial load: fetch spots
  useEffect(() => {
    fetchSpots(null);
  }, []);

  // Request browser geolocation with 10 second timeout and 60 second maximumAge
  const handleRequestLocation = () => {
    // Show pressed state immediately before any answer arrives
    setLocationStatus('asking');

    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setUserCoords(coords);
        setLocationReadAt(new Date());
        setLocationStatus('granted');
        fetchSpots(coords);
      },
      (error) => {
        // PositionError codes: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (error.code === 1) {
          setLocationStatus('refused');
        } else if (error.code === 3) {
          setLocationStatus('timeout');
        } else if (error.code === 2) {
          setLocationStatus('unavailable');
        } else {
          setLocationStatus('unavailable');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  // Calculate distance in km from user's location to a spot
  const getSpotDistanceKm = (spot: NearestSpotItem): number | null => {
    if (spot.distanceFromUserKm !== null && spot.distanceFromUserKm !== undefined) {
      return spot.distanceFromUserKm;
    }
    if (userCoords) {
      const dMetres = haversineMetres(userCoords.lat, userCoords.lon, spot.lat, spot.lon);
      return Math.round((dMetres / 1000) * 10) / 10;
    }
    return null;
  };

  // Rank spots by distance if location is held
  const sortedSpots = useMemo(() => {
    if (!userCoords) return spots;
    return [...spots].sort((a, b) => {
      const distA = getSpotDistanceKm(a) ?? 9999;
      const distB = getSpotDistanceKm(b) ?? 9999;
      return distA - distB;
    });
  }, [spots, userCoords]);

  // In-browser text filtering: matches spot name, bus stop name, and road name
  const searchFilteredSpots = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return sortedSpots;
    return sortedSpots.filter((spot) => {
      const nameMatch = spot.name.toLowerCase().includes(term);
      const busStopNameMatch = spot.nearestBusStop?.name?.toLowerCase().includes(term) ?? false;
      const roadMatch = spot.nearestBusStop?.road?.toLowerCase().includes(term) ?? false;
      return nameMatch || busStopNameMatch || roadMatch;
    });
  }, [sortedSpots, searchTerm]);

  // Facing filter: Sunset lists west-facing spots, sunrise lists east-facing spots
  const matchingFacingSpots = useMemo(() => {
    return searchFilteredSpots.filter((spot) => spot.facing === targetFacing);
  }, [searchFilteredSpots, targetFacing]);

  const oppositeFacingSpots = useMemo(() => {
    return searchFilteredSpots.filter((spot) => spot.facing === oppositeFacing);
  }, [searchFilteredSpots, oppositeFacing]);

  const displayedSpots = showOppositeFacing ? searchFilteredSpots : matchingFacingSpots;
  const hiddenCount = oppositeFacingSpots.length;

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

  // Format ISO timestamp or Date object into human-readable words without timezone conversion confusion
  const formatFriendlyTime = (dateInput?: string | Date | null) => {
    if (!dateInput) return '';
    try {
      const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      return date.toLocaleTimeString('en-SG', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return String(dateInput);
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

        {/* Location Action Button with distinct visible states */}
        <div className="flex items-center gap-2">
          <button
            id="locate-me-button"
            type="button"
            onClick={handleRequestLocation}
            disabled={locationStatus === 'asking'}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
              locationStatus === 'asking'
                ? 'bg-amber-600 text-white opacity-85 ring-2 ring-amber-400 cursor-wait'
                : locationStatus === 'granted'
                ? 'bg-emerald-700 text-white hover:bg-emerald-800 ring-1 ring-emerald-600'
                : locationStatus === 'refused'
                ? 'bg-stone-100 border border-stone-300 text-stone-800 hover:bg-stone-200'
                : locationStatus === 'timeout'
                ? 'bg-amber-50 border border-amber-300 text-amber-900 hover:bg-amber-100'
                : locationStatus === 'unavailable'
                ? 'bg-stone-100 border border-stone-300 text-stone-800 hover:bg-stone-200'
                : mode === 'sunset'
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white hover:opacity-95'
                : 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white hover:opacity-95'
            }`}
          >
            {locationStatus === 'asking' ? (
              <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
            ) : locationStatus === 'granted' ? (
              <MapPin className="w-4 h-4 shrink-0 text-emerald-200" />
            ) : locationStatus === 'refused' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            ) : locationStatus === 'timeout' ? (
              <Clock className="w-4 h-4 shrink-0 text-amber-600" />
            ) : locationStatus === 'unavailable' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            ) : (
              <MapPin className="w-4 h-4 shrink-0" />
            )}

            <span>
              {locationStatus === 'asking'
                ? 'Asking browser for location...'
                : locationStatus === 'granted'
                ? 'Location active (tap to refresh)'
                : locationStatus === 'refused'
                ? 'Location refused (tap to retry)'
                : locationStatus === 'timeout'
                ? 'Location timed out (tap to retry)'
                : locationStatus === 'unavailable'
                ? 'Position unavailable (tap to retry)'
                : 'Find nearest spot to me'}
            </span>
          </button>
        </div>
      </div>

      {/* Geolocation status banners: Visibly distinct for each PositionError outcome */}
      {locationStatus === 'refused' && (
        <div
          id="location-refused-banner"
          className="mb-6 p-4 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 text-xs sm:text-sm flex items-start gap-3 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-semibold text-stone-900">
              Location permission was denied.
            </p>
            <p className="text-stone-700 leading-relaxed">
              If you want to share your location, check these three places in the order you should try them:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-stone-700 leading-relaxed pl-0.5">
              <li>
                <strong className="text-stone-900">This site&apos;s location permission in the browser:</strong>{' '}
                In Chrome, click the icon at the left of the address bar to allow location; in Safari, check website permissions for this page.
              </li>
              <li>
                <strong className="text-stone-900">The browser&apos;s own location setting:</strong>{' '}
                Ensure location access is enabled in your browser&apos;s general preferences or privacy settings.
              </li>
              <li>
                <strong className="text-stone-900">The operating system&apos;s location settings:</strong>{' '}
                On macOS: <span className="underline decoration-stone-400">System Settings</span>, then <span className="underline decoration-stone-400">Privacy and Security</span>, then <span className="underline decoration-stone-400">Location Services</span>, then ensure your browser is enabled in the list. On other operating systems, ensure system location services are enabled for your browser.
              </li>
            </ol>
            <p className="text-stone-600 pt-1">
              You can use the filter box below to find spots by name, bus stop, or road without sharing your location.
            </p>
          </div>
        </div>
      )}

      {locationStatus === 'timeout' && (
        <div
          id="location-timeout-banner"
          className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3 shadow-sm"
        >
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-900">
              Location request timed out after 10 seconds.
            </p>
            <p className="text-amber-800 leading-relaxed">
              Your device took too long to return GPS coordinates. You can tap &ldquo;Location timed out (tap to retry)&rdquo; above to try again, or use the filter box below to search spots without location.
            </p>
          </div>
        </div>
      )}

      {locationStatus === 'unavailable' && (
        <div
          id="location-unavailable-banner"
          className="mb-6 p-4 rounded-xl bg-stone-100 border border-stone-300 text-stone-800 text-xs sm:text-sm flex items-start gap-3 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-stone-900">
              Position unavailable from your device.
            </p>
            <p className="text-stone-700 leading-relaxed">
              Your browser could not determine your current position. Check your device location or GPS settings, or use the filter box below to search spots by name or bus stop.
            </p>
          </div>
        </div>
      )}

      {/* Explanatory relationship banner comparing the two rankings */}
      <div
        id="rankings-relationship-note"
        className="mb-4 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
      >
        <div>
          <strong className="text-stone-800">Two rankings at a glance: </strong>
          The section above ranks spots by atmospheric sky conditions (0–100 score) for photography tonight.
          {userCoords ? (
            <span> This section ranks spots by straight-line distance from your location (read at <strong className="text-stone-900">{formatFriendlyTime(locationReadAt)}</strong>). Compare both side-by-side to choose the best light within reach.</span>
          ) : (
            <span> This section orders spots by distance once your location is known. Tap &ldquo;Find nearest spot to me&rdquo; to see distances side-by-side.</span>
          )}
        </div>
      </div>

      {/* Line above list when location is held: specifies distance ordering and exact time location was read */}
      {userCoords && locationStatus === 'granted' && (
        <div
          id="location-ordered-banner"
          className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-semibold">
              The list is ordered by distance from your location
              {locationReadAt ? ` (read at ${formatFriendlyTime(locationReadAt)})` : ''}.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 font-bold px-2 py-0.5 rounded bg-emerald-100 border border-emerald-200 shrink-0 self-start sm:self-auto">
            Nearest First
          </span>
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

      {/* Spot Filter Search Box: matches spot name, bus stop name, and road name without promising landmarks */}
      <div className="mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="spot-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter spots by name, bus stop, or road..."
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
          {displayedSpots.map((spot, index) => {
            const isExpanded = selectedSpotName === spot.name;
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lon}&travelmode=transit`;
            const distanceKm = getSpotDistanceKm(spot);

            // Match spot with forecast data to retrieve conditions score for the selected mode and date
            const forecastMatch = forecastSpots?.find(
              (f) => f.name.toLowerCase().trim() === spot.name.toLowerCase().trim()
            );
            const conditionsScore = forecastMatch?.score;

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

                      {/* Conditions score and distance indicators placed beside each other */}
                      {conditionsScore !== undefined && (
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            conditionsScore >= 70
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : conditionsScore >= 40
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-stone-100 text-stone-700 border-stone-300'
                          }`}
                          title={`Forecast conditions score for this spot (${mode})`}
                        >
                          Sky Score: {conditionsScore}/100
                        </span>
                      )}

                      {distanceKm !== null && (
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            mode === 'sunset'
                              ? 'bg-amber-50 text-orange-900 border-amber-300'
                              : 'bg-rose-50 text-rose-900 border-rose-300'
                          }`}
                          title="Straight-line distance from your location"
                        >
                          {distanceKm.toFixed(1)} km away
                        </span>
                      )}

                      {forecastMatch?.sharesGridPoint && (
                        <span
                          className="text-[11px] text-amber-800 font-medium bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 inline-flex items-center gap-1"
                          title="Forecast grid cell is shared with another location"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Same forecast grid square as {forecastMatch.sharedWithSpots?.join(', ')} — readings are not independent</span>
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
                          You can still tap &ldquo;Directions&rdquo; above to view full Google Maps transit route options.
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

          {displayedSpots.length === 0 && (
            <div className="p-8 text-center text-xs sm:text-sm text-stone-500 bg-stone-50 rounded-xl border border-stone-200">
              No shooting spots found matching &ldquo;{searchTerm}&rdquo; facing {targetFacing} for {mode}.
            </div>
          )}

          {/* Hidden spots indicator: explains how many spots are hidden and why, with a control to show them anyway */}
          {!showOppositeFacing && hiddenCount > 0 && (
            <div
              id="hidden-spots-notice"
              className="mt-4 p-3.5 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-stone-500 shrink-0" />
                <span>
                  <strong>{hiddenCount} {hiddenCount === 1 ? 'spot' : 'spots'} facing {oppositeFacing} {hiddenCount === 1 ? 'is' : 'are'} hidden</strong> because {hiddenCount === 1 ? 'it faces' : 'they face'} away from the {mode}.
                </span>
              </div>
              <button
                id="toggle-show-hidden-spots-btn"
                type="button"
                onClick={() => setShowOppositeFacing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 font-semibold text-xs hover:bg-stone-50 transition-colors shadow-sm self-start sm:self-auto shrink-0"
              >
                <Eye className="w-3.5 h-3.5 text-stone-600" />
                <span>Show {hiddenCount === 1 ? 'it' : 'them'} anyway</span>
              </button>
            </div>
          )}

          {showOppositeFacing && hiddenCount > 0 && (
            <div
              id="hidden-spots-notice"
              className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Showing all spots</strong> (including {hiddenCount} facing {oppositeFacing} away from the {mode}).
                </span>
              </div>
              <button
                id="toggle-hide-opposite-spots-btn"
                type="button"
                onClick={() => setShowOppositeFacing(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold text-xs hover:bg-amber-100/50 transition-colors shadow-sm self-start sm:self-auto shrink-0"
              >
                <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                <span>Hide opposite-facing spots</span>
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
