import { useState } from 'react';
import { Mode, SpotItem, SkyApiResponse } from '../types';
import { Sunset, Sunrise, ChevronDown, ChevronUp, AlertTriangle, CloudSun, Eye, Compass } from 'lucide-react';

interface TonightSectionProps {
  mode: Mode;
  onModeChange: (newMode: Mode) => void;
  data: SkyApiResponse | null;
  loading: boolean;
  errorState: {
    type: 'none' | 'loading' | 'outOfRange' | 'upstreamRefused' | 'unreachable' | 'other';
    message: string;
  };
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function TonightSection({
  mode,
  onModeChange,
  data,
  loading,
  errorState,
  selectedDate,
  onDateChange,
}: TonightSectionProps) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [selectedSpotIndex, setSelectedSpotIndex] = useState<number>(0);

  // Format Singapore Time and Date cleanly
  const formatEventTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    try {
      const parts = isoString.split('T');
      if (parts.length < 2) return isoString;
      const [hourStr, minStr] = parts[1].split(':');
      const hour = parseInt(hourStr, 10);
      const minute = minStr || '00';
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      return `${displayHour}:${minute} ${ampm}`;
    } catch {
      return isoString;
    }
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(Date.UTC(year, month - 1, day));
      return d.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      return dateStr;
    }
  };

  const getVerdict = (score: number) => {
    if (score >= 80) return 'Outstanding conditions: pack your tripod and head out early.';
    if (score >= 65) return 'Favorable conditions: high probability of vibrant color in the sky.';
    if (score >= 50) return 'Moderate conditions: patchy light and decent potential for dramatic clouds.';
    if (score >= 35) return 'Fair conditions: overcast skies or low clouds may mute the light.';
    return 'Poor conditions: thick cloud cover or low visibility; probably skip the tripod tonight.';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-amber-400 border-amber-500/40 bg-amber-950/20';
    if (score >= 65) return 'text-orange-400 border-orange-500/40 bg-orange-950/20';
    if (score >= 50) return 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20';
    if (score >= 35) return 'text-zinc-300 border-zinc-700 bg-zinc-900/40';
    return 'text-zinc-400 border-zinc-800 bg-zinc-900/30';
  };

  const rankedSpots = data?.rankedSpots || [];
  const currentSpot: SpotItem | null = rankedSpots[selectedSpotIndex] || rankedSpots[0] || null;

  const expectedSpotsCount = mode === 'sunset' ? 3 : 2;
  const missingSpots = data?.missingSpots || [];

  return (
    <section id="tonight-section" className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
      {/* Top Bar: Mode Toggle and Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              {mode === 'sunset' ? 'Tonight' : 'Morning'} Forecast
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Live Singapore conditions for landscape & golden hour photographers
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Day Navigation */}
          {data?.availableDates && data.availableDates.length > 0 && (
            <select
              id="date-select"
              value={selectedDate || data.date}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-zinc-800/90 text-xs sm:text-sm text-zinc-200 border border-zinc-700 rounded-lg px-3 py-2 outline-none focus:border-amber-500 transition-colors"
              title="Select Forecast Date"
            >
              {data.availableDates.map((d, i) => (
                <option key={d} value={d}>
                  {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d} ({d})
                </option>
              ))}
            </select>
          )}

          {/* Mode Toggle: Sunset & Sunrise */}
          <div id="mode-toggle-group" className="inline-flex p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
            <button
              id="mode-toggle-sunset"
              type="button"
              onClick={() => {
                setSelectedSpotIndex(0);
                onModeChange('sunset');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                mode === 'sunset'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sunset className="w-4 h-4" />
              Sunset
            </button>
            <button
              id="mode-toggle-sunrise"
              type="button"
              onClick={() => {
                setSelectedSpotIndex(0);
                onModeChange('sunrise');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                mode === 'sunrise'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sunrise className="w-4 h-4" />
              Sunrise
            </button>
          </div>
        </div>
      </div>

      {/* State A: Loading */}
      {loading && (
        <div id="weather-loading-state" className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
          <p className="text-zinc-300 font-medium text-base">
            Gathering current atmospheric readings and cloud layers across Singapore's shooting spots...
          </p>
          <p className="text-zinc-500 text-xs mt-2">Connecting to Open-Meteo multi-location service</p>
        </div>
      )}

      {/* State B: Forecast does not cover requested day */}
      {!loading && errorState.type === 'outOfRange' && (
        <div id="weather-outofrange-state" className="my-8 p-6 bg-amber-950/20 border border-amber-800/40 rounded-xl text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-amber-200 text-sm sm:text-base font-medium">
            The forecast does not cover this day yet; Open-Meteo's free tier covers up to 7 days ahead — please check back closer to your shoot.
          </p>
          <p className="text-zinc-400 text-xs mt-2">
            Selected date: {selectedDate || 'Unknown'}. Please select a date within the upcoming 7-day window.
          </p>
          <button
            type="button"
            onClick={() => onDateChange(data?.availableDates?.[0] || '')}
            className="mt-4 px-4 py-2 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors"
          >
            Return to Today's Forecast
          </button>
        </div>
      )}

      {/* State C: Upstream refused (non-2xx) */}
      {!loading && errorState.type === 'upstreamRefused' && (
        <div id="weather-refused-state" className="my-8 p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-200 text-sm sm:text-base font-medium">
            {errorState.message}
          </p>
          <p className="text-zinc-400 text-xs mt-2">
            The weather provider rejected the request. Please try refreshing again in a moment.
          </p>
        </div>
      )}

      {/* State D: Upstream unreachable (network error) */}
      {!loading && errorState.type === 'unreachable' && (
        <div id="weather-unreachable-state" className="my-8 p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-200 text-sm sm:text-base font-medium">
            Unable to reach Open-Meteo weather service. Please check your internet connection or try again shortly.
          </p>
        </div>
      )}

      {/* State E: Missing spots warning banner (one spot came back but another did not) */}
      {!loading && errorState.type === 'none' && missingSpots.length > 0 && (
        <div id="weather-missing-spot-banner" className="my-4 p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl text-amber-200 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Partial data returned:</span> Showing {rankedSpots.length} of {expectedSpotsCount} spots. Missing data for {missingSpots.join(', ')} from the weather provider.
          </div>
        </div>
      )}

      {/* Main Content (when data loaded successfully) */}
      {!loading && errorState.type === 'none' && currentSpot && (
        <div className="mt-6 space-y-8">
          {/* Main Hero: Large Exact Time, Date, Score, Verdict */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Box: Time & Date */}
            <div id="exact-time-display" className="lg:col-span-6 bg-zinc-950/70 border border-zinc-800/90 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-amber-500/90">
                  {mode === 'sunset' ? 'Exact Sunset Moment' : 'Exact Sunrise Moment'}
                </span>
                <div className="flex items-baseline gap-3 mt-2">
                  <span id="large-event-time" className="text-5xl sm:text-6xl font-bold tracking-tight text-white font-mono">
                    {formatEventTime(data?.eventTime || currentSpot.eventTime)}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                    Singapore time
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-zinc-200">
                    {formatDisplayDate(data?.date)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    Target Spot: <span className="text-amber-400 font-medium">{currentSpot.name}</span>
                  </div>
                </div>
                <span className="text-xs bg-zinc-800/80 text-zinc-300 px-2.5 py-1 rounded-full border border-zinc-700/60">
                  Facing {currentSpot.facing}
                </span>
              </div>
            </div>

            {/* Right Box: Score & Plain English Verdict */}
            <div id="score-verdict-display" className={`lg:col-span-6 border rounded-xl p-6 flex flex-col justify-between ${getScoreColor(currentSpot.score)}`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-zinc-300">
                    Conditions Score
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-950/60 border border-zinc-800 text-zinc-400">
                    0 — 100 Scale
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span id="score-number" className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono">
                    {currentSpot.score}
                  </span>
                  <span className="text-lg text-zinc-400 font-medium">/ 100</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-800/60">
                <p id="plain-english-verdict" className="text-sm sm:text-base font-semibold text-zinc-100 leading-snug">
                  {getVerdict(currentSpot.score)}
                </p>
              </div>
            </div>
          </div>

          {/* SOURCED NUMBERS: The four sourced figures always visible and labelled */}
          <div id="sourced-numbers-section">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                Sourced Atmospheric Metrics ({currentSpot.name})
              </h3>
              <span className="text-xs text-zinc-500">Source: Open-Meteo raw hourly metrics</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Metric 1: Low Cloud % */}
              <div id="metric-low-cloud" className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Low Cloud %</span>
                  <CloudSun className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                  {currentSpot.raw.cloud_cover_low}%
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Lower is better (blocks horizon)</p>
              </div>

              {/* Metric 2: Mid Cloud % */}
              <div id="metric-mid-cloud" className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Mid Cloud %</span>
                  <CloudSun className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                  {currentSpot.raw.cloud_cover_mid}%
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">~50% optimal for color bounce</p>
              </div>

              {/* Metric 3: High Cloud % */}
              <div id="metric-high-cloud" className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>High Cloud %</span>
                  <CloudSun className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                  {currentSpot.raw.cloud_cover_high}%
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Reflects deep pinks & purples</p>
              </div>

              {/* Metric 4: Visibility in KILOMETRES */}
              <div id="metric-visibility" className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Visibility in KILOMETRES</span>
                  <Eye className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
                  {currentSpot.raw.visibility_km} <span className="text-sm font-normal text-zinc-400">km</span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">Clean air up to 20 km cap</p>
              </div>
            </div>
          </div>

          {/* Expandable "How this score works" Panel */}
          <div id="how-this-score-works-panel" className="border border-zinc-800 rounded-xl bg-zinc-950/60 overflow-hidden transition-all">
            <button
              id="how-this-score-works-toggle"
              type="button"
              onClick={() => setHowItWorksOpen(!howItWorksOpen)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-zinc-900/50 transition-colors"
            >
              <span className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                <span>How this score works</span>
                <span className="text-xs text-zinc-500 font-normal">(Click to {howItWorksOpen ? 'collapse' : 'expand'})</span>
              </span>
              {howItWorksOpen ? (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {howItWorksOpen && (
              <div className="px-5 pb-5 pt-2 border-t border-zinc-800/80 text-xs sm:text-sm text-zinc-300 space-y-4">
                {/* MANDATORY EXACT SENTENCE */}
                <p id="score-mandated-disclaimer" className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-amber-200 font-medium">
                  This score is my own method, not a figure published by any weather service. The four numbers above are the sourced data.
                </p>

                <div>
                  <h4 className="font-semibold text-white mb-2">Mathematical Formulation</h4>
                  <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg font-mono text-[11px] sm:text-xs text-amber-300 overflow-x-auto">
{`midHigh    = (cloud_cover_mid + cloud_cover_high) / 2
midHighPts = 100 - Math.abs(midHigh - 50) * 2
lowPts     = Math.max(0, 100 - cloud_cover_low * 2.5)
visKm      = visibility / 1000
visPts     = Math.min(100, visKm / 20 * 100)
score      = Math.round(0.5*midHighPts + 0.3*lowPts + 0.2*visPts)`}
                  </pre>
                </div>

                <div className="space-y-2 text-zinc-400 text-xs leading-relaxed">
                  <p>
                    <strong className="text-zinc-200">1. Mid & High Clouds (50% weight):</strong> Mid and high altitude clouds provide the reflective canvas for vibrant sunset and sunrise tones. When coverage is near 50%, there is enough cloud cover to bounce intense color without completely obscuring the sky.
                  </p>
                  <p>
                    <strong className="text-zinc-200">2. Low Clouds (30% weight):</strong> Low-level clouds sit directly above the horizon and block sunlight from reaching higher clouds or illuminating the landscape. Lower values preserve clear horizon illumination.
                  </p>
                  <p>
                    <strong className="text-zinc-200">3. Atmospheric Visibility (20% weight):</strong> Converted from metres to kilometres (capped at 20 km for maximum points). Greater clarity ensures crisp contrast and rich tonal gradation across Singapore's waterways and cityscape.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ranked List of Shooting Spots */}
          <div id="ranked-spots-section">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Ranked Shooting Spots ({mode === 'sunset' ? 'West-Facing' : 'East-Facing'})
                </h3>
                <p className="text-xs text-zinc-400">
                  Ranked best conditions first for {mode}. Click any row to inspect its exact figures above.
                </p>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                {rankedSpots.length} spots evaluated
              </span>
            </div>

            <div className="space-y-2.5">
              {rankedSpots.map((spot, index) => {
                const isSelected = index === selectedSpotIndex;
                return (
                  <div
                    key={spot.name}
                    id={`spot-row-${index}`}
                    onClick={() => setSelectedSpotIndex(index)}
                    className={`cursor-pointer border rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-zinc-800/90 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-zinc-950/60 border-zinc-800/90 hover:bg-zinc-800/40 hover:border-zinc-700'
                    }`}
                  >
                    {/* Spot Name & Rank */}
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                        index === 0
                          ? 'bg-amber-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}>
                        #{index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {spot.name}
                          </span>
                          {index === 0 && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
                              Top Pick
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                          <Compass className="w-3 h-3 text-zinc-500" />
                          <span>Facing {spot.facing}</span>
                          <span className="text-zinc-600">•</span>
                          <span>{spot.lat.toFixed(4)}, {spot.lon.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats: Score and low/mid/high cloud figures */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800/80">
                      {/* Cloud Figures */}
                      <div className="flex items-center gap-3 text-xs text-zinc-300">
                        <div className="text-center">
                          <span className="block text-[10px] uppercase text-zinc-500">Low</span>
                          <span className="font-mono font-medium">{spot.raw.cloud_cover_low}%</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] uppercase text-zinc-500">Mid</span>
                          <span className="font-mono font-medium">{spot.raw.cloud_cover_mid}%</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] uppercase text-zinc-500">High</span>
                          <span className="font-mono font-medium">{spot.raw.cloud_cover_high}%</span>
                        </div>
                        <div className="text-center pl-1 border-l border-zinc-800">
                          <span className="block text-[10px] uppercase text-zinc-500">Vis</span>
                          <span className="font-mono font-medium">{spot.raw.visibility_km}km</span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm min-w-[56px] text-center ${getScoreColor(spot.score)}`}>
                        {spot.score}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
