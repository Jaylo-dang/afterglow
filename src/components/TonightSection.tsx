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
    // Score card is the warmest, most saturated element on the page
    if (mode === 'sunset') {
      // Sunset mode: deep amber and burnt coral warming into dusky violet
      if (score >= 80) {
        return 'bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 text-white border-orange-500/30 shadow-lg shadow-orange-500/25';
      }
      if (score >= 65) {
        return 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 text-white border-amber-400/30 shadow-md shadow-orange-500/20';
      }
      if (score >= 50) {
        return 'bg-gradient-to-br from-amber-600/90 via-rose-700/90 to-purple-800/90 text-white border-rose-500/30 shadow-md shadow-rose-500/20';
      }
      if (score >= 35) {
        return 'bg-gradient-to-br from-stone-700 via-rose-900/80 to-purple-950 text-white border-stone-600 shadow-md';
      }
      return 'bg-stone-800 text-stone-100 border-stone-700 shadow-md';
    } else {
      // Sunrise mode: cooler dawn - soft rose, peach lifting into pale gold
      if (score >= 80) {
        return 'bg-gradient-to-br from-rose-500 via-pink-500 to-amber-400 text-white border-rose-300/40 shadow-lg shadow-rose-400/25';
      }
      if (score >= 65) {
        return 'bg-gradient-to-br from-rose-400 via-peach-400 to-amber-300 text-stone-900 border-rose-200/50 shadow-md shadow-rose-300/20';
      }
      if (score >= 50) {
        return 'bg-gradient-to-br from-rose-300 via-amber-200 to-amber-300 text-stone-900 border-amber-200 shadow-md';
      }
      if (score >= 35) {
        return 'bg-gradient-to-br from-stone-200 via-rose-100 to-stone-300 text-stone-800 border-stone-300 shadow-md';
      }
      return 'bg-stone-200 text-stone-700 border-stone-300 shadow-md';
    }
  };

  const rankedSpots = data?.rankedSpots || [];
  const currentSpot: SpotItem | null = rankedSpots[selectedSpotIndex] || rankedSpots[0] || null;

  const expectedSpotsCount = mode === 'sunset' ? 3 : 2;
  const missingSpots = data?.missingSpots || [];

  return (
    <section
      id="tonight-section"
      className="bg-white/95 border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-stone-200/60 backdrop-blur-sm transition-colors duration-400"
    >
      {/* Top Bar: Mode Toggle and Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full animate-pulse transition-colors duration-400 ${
                mode === 'sunset' ? 'bg-orange-500' : 'bg-rose-400'
              }`}
            />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              {mode === 'sunset' ? 'Tonight' : 'Morning'} Forecast
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 font-normal">
            Live Singapore conditions for landscape & golden hour photographers
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Day Navigation */}
          {data?.availableDates && data.availableDates.length > 0 && (
            <select
              id="date-select"
              value={selectedDate || data.date}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full sm:w-auto bg-stone-100 text-xs sm:text-sm text-stone-800 font-medium border border-stone-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500 focus:bg-white transition-colors"
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
          <div
            id="mode-toggle-group"
            className="flex sm:inline-flex w-full sm:w-auto p-1 bg-stone-100/90 border border-stone-200/80 rounded-xl transition-colors duration-400"
          >
            <button
              id="mode-toggle-sunset"
              type="button"
              onClick={() => {
                setSelectedSpotIndex(0);
                onModeChange('sunset');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${
                mode === 'sunset'
                  ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white shadow-md'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Sunset className="w-4 h-4 shrink-0" />
              Sunset
            </button>
            <button
              id="mode-toggle-sunrise"
              type="button"
              onClick={() => {
                setSelectedSpotIndex(0);
                onModeChange('sunrise');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 ${
                mode === 'sunrise'
                  ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white shadow-md'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
              }`}
            >
              <Sunrise className="w-4 h-4 shrink-0" />
              Sunrise
            </button>
          </div>
        </div>
      </div>

      {/* State A: Loading */}
      {loading && (
        <div id="weather-loading-state" className="py-16 text-center">
          <div
            className={`inline-block w-8 h-8 border-2 rounded-full animate-spin mb-4 ${
              mode === 'sunset'
                ? 'border-orange-500/30 border-t-orange-500'
                : 'border-rose-400/30 border-t-rose-400'
            }`}
          />
          <p className="text-stone-800 font-semibold text-base">
            Gathering current atmospheric readings and cloud layers across Singapore's shooting spots...
          </p>
          <p className="text-stone-600 text-xs mt-2 font-medium">Connecting to Open-Meteo multi-location service</p>
        </div>
      )}

      {/* State B: Forecast does not cover requested day */}
      {!loading && errorState.type === 'outOfRange' && (
        <div id="weather-outofrange-state" className="my-8 p-6 bg-amber-50 border border-amber-300 rounded-xl text-center">
          <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
          <p className="text-amber-950 text-sm sm:text-base font-semibold">
            The forecast does not cover this day yet; Open-Meteo's free tier covers up to 7 days ahead — please check back closer to your shoot.
          </p>
          <p className="text-stone-600 text-xs mt-2">
            Selected date: {selectedDate || 'Unknown'}. Please select a date within the upcoming 7-day window.
          </p>
          <button
            type="button"
            onClick={() => onDateChange(data?.availableDates?.[0] || '')}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow"
          >
            Return to Today's Forecast
          </button>
        </div>
      )}

      {/* State C: Upstream refused (non-2xx) */}
      {!loading && errorState.type === 'upstreamRefused' && (
        <div id="weather-refused-state" className="my-8 p-6 bg-red-50 border border-red-300 rounded-xl text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <p className="text-red-900 text-sm sm:text-base font-semibold">
            {errorState.message}
          </p>
          <p className="text-stone-600 text-xs mt-2">
            The weather provider rejected the request. Please try refreshing again in a moment.
          </p>
        </div>
      )}

      {/* State D: Upstream unreachable (network error) */}
      {!loading && errorState.type === 'unreachable' && (
        <div id="weather-unreachable-state" className="my-8 p-6 bg-red-50 border border-red-300 rounded-xl text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <p className="text-red-900 text-sm sm:text-base font-semibold">
            Unable to reach Open-Meteo weather service. Please check your internet connection or try again shortly.
          </p>
        </div>
      )}

      {/* State E: Missing spots warning banner (one spot came back but another did not) */}
      {!loading && errorState.type === 'none' && missingSpots.length > 0 && (
        <div id="weather-missing-spot-banner" className="my-4 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
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
            <div
              id="exact-time-display"
              className="lg:col-span-6 bg-stone-50/90 border border-stone-200/90 rounded-xl p-6 flex flex-col justify-between shadow-sm"
            >
              <div>
                <span
                  className={`text-xs uppercase tracking-wider font-bold transition-colors duration-400 ${
                    mode === 'sunset' ? 'text-amber-800' : 'text-rose-800'
                  }`}
                >
                  {mode === 'sunset' ? 'Exact Sunset Moment' : 'Exact Sunrise Moment'}
                </span>
                <div className="flex items-baseline gap-3 mt-2">
                  <span id="large-event-time" className="text-5xl sm:text-6xl font-extrabold tracking-tight text-stone-900 font-mono">
                    {formatEventTime(data?.eventTime || currentSpot.eventTime)}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-stone-600 font-semibold">
                    Singapore time
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-200 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-stone-900">
                    {formatDisplayDate(data?.date)}
                  </div>
                  <div className="text-xs text-stone-600 mt-0.5">
                    Target Spot: <span className="font-bold text-stone-900">{currentSpot.name}</span>
                  </div>
                </div>
                <span className="text-xs bg-stone-200/80 text-stone-800 font-medium px-2.5 py-1 rounded-full border border-stone-300">
                  Facing {currentSpot.facing}
                </span>
              </div>
            </div>

            {/* Right Box: Score & Plain English Verdict (The warmest, most saturated element on the page) */}
            <div
              id="score-verdict-display"
              className={`lg:col-span-6 border rounded-xl p-6 flex flex-col justify-between transition-all duration-400 ${getScoreColor(currentSpot.score)}`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold opacity-90">
                    Conditions Score
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-black/20 border border-white/20 font-medium text-white">
                    0 — 100 Scale
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span id="score-number" className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono text-white">
                    {currentSpot.score}
                  </span>
                  <span className="text-lg font-semibold opacity-85 text-white">/ 100</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/20">
                <p id="plain-english-verdict" className="text-sm sm:text-base font-bold leading-snug text-white drop-shadow-sm">
                  {getVerdict(currentSpot.score)}
                </p>
              </div>
            </div>
          </div>

          {/* SOURCED NUMBERS: The four sourced figures always visible and labelled */}
          <div id="sourced-numbers-section">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs uppercase tracking-wider font-bold text-stone-700">
                Sourced Atmospheric Metrics ({currentSpot.name})
              </h3>
              <span className="text-xs text-stone-600 font-medium">Source: Open-Meteo raw hourly metrics</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Metric 1: Low Cloud % */}
              <div id="metric-low-cloud" className="bg-stone-50/90 border border-stone-200/90 rounded-xl p-4 shadow-sm hover:border-stone-300 transition-colors">
                <div className="flex items-center justify-between text-stone-600 text-xs mb-1 font-semibold">
                  <span>Low Cloud %</span>
                  <CloudSun className="w-3.5 h-3.5 text-stone-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono">
                  {currentSpot.raw.cloud_cover_low}%
                </div>
                <p className="text-[11px] text-stone-600 mt-1 font-medium">Lower is better (blocks horizon)</p>
              </div>

              {/* Metric 2: Mid Cloud % */}
              <div id="metric-mid-cloud" className="bg-stone-50/90 border border-stone-200/90 rounded-xl p-4 shadow-sm hover:border-stone-300 transition-colors">
                <div className="flex items-center justify-between text-stone-600 text-xs mb-1 font-semibold">
                  <span>Mid Cloud %</span>
                  <CloudSun className="w-3.5 h-3.5 text-stone-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono">
                  {currentSpot.raw.cloud_cover_mid}%
                </div>
                <p className="text-[11px] text-stone-600 mt-1 font-medium">~50% optimal for color bounce</p>
              </div>

              {/* Metric 3: High Cloud % */}
              <div id="metric-high-cloud" className="bg-stone-50/90 border border-stone-200/90 rounded-xl p-4 shadow-sm hover:border-stone-300 transition-colors">
                <div className="flex items-center justify-between text-stone-600 text-xs mb-1 font-semibold">
                  <span>High Cloud %</span>
                  <CloudSun className="w-3.5 h-3.5 text-stone-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono">
                  {currentSpot.raw.cloud_cover_high}%
                </div>
                <p className="text-[11px] text-stone-600 mt-1 font-medium">Reflects deep pinks & purples</p>
              </div>

              {/* Metric 4: Visibility in KILOMETRES */}
              <div id="metric-visibility" className="bg-stone-50/90 border border-stone-200/90 rounded-xl p-4 shadow-sm hover:border-stone-300 transition-colors">
                <div className="flex items-center justify-between text-stone-600 text-xs mb-1 font-semibold">
                  <span>Visibility in KILOMETRES</span>
                  <Eye className="w-3.5 h-3.5 text-stone-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-stone-900 font-mono">
                  {currentSpot.raw.visibility_km} <span className="text-sm font-semibold text-stone-600">km</span>
                </div>
                <p className="text-[11px] text-stone-600 mt-1 font-medium">Clean air up to 20 km cap</p>
              </div>
            </div>
          </div>

          {/* Expandable "How this score works" Panel */}
          <div id="how-this-score-works-panel" className="border border-stone-200/90 rounded-xl bg-stone-50/70 overflow-hidden shadow-sm transition-all">
            <button
              id="how-this-score-works-toggle"
              type="button"
              onClick={() => setHowItWorksOpen(!howItWorksOpen)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-stone-100/80 transition-colors"
            >
              <span className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <span>How this score works</span>
                <span className="text-xs text-stone-500 font-normal">(Click to {howItWorksOpen ? 'collapse' : 'expand'})</span>
              </span>
              {howItWorksOpen ? (
                <ChevronUp className="w-4 h-4 text-stone-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-500" />
              )}
            </button>

            {howItWorksOpen && (
              <div className="px-5 pb-5 pt-2 border-t border-stone-200 text-xs sm:text-sm text-stone-700 space-y-4">
                {/* MANDATORY EXACT SENTENCE */}
                <p
                  id="score-mandated-disclaimer"
                  className={`p-3 border rounded-lg font-semibold text-xs sm:text-sm transition-colors duration-400 ${
                    mode === 'sunset'
                      ? 'bg-amber-50 border-amber-300 text-amber-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}
                >
                  This score is my own method, not a figure published by any weather service. The four numbers above are the sourced data.
                </p>

                <div>
                  <h4 className="font-bold text-stone-900 mb-2">Mathematical Formulation</h4>
                  <pre className="p-3 bg-stone-900 border border-stone-800 rounded-lg font-mono text-[11px] sm:text-xs text-amber-300 overflow-x-auto shadow-inner">
{`midHigh    = (cloud_cover_mid + cloud_cover_high) / 2
midHighPts = 100 - Math.abs(midHigh - 50) * 2
lowPts     = Math.max(0, 100 - cloud_cover_low * 2.5)
visKm      = visibility / 1000
visPts     = Math.min(100, visKm / 20 * 100)
score      = Math.round(0.5*midHighPts + 0.3*lowPts + 0.2*visPts)`}
                  </pre>
                </div>

                <div className="space-y-2 text-stone-700 text-xs leading-relaxed">
                  <p>
                    <strong className="text-stone-900">1. Mid & High Clouds (50% weight):</strong> Mid and high altitude clouds provide the reflective canvas for vibrant sunset and sunrise tones. When coverage is near 50%, there is enough cloud cover to bounce intense color without completely obscuring the sky.
                  </p>
                  <p>
                    <strong className="text-stone-900">2. Low Clouds (30% weight):</strong> Low-level clouds sit directly above the horizon and block sunlight from reaching higher clouds or illuminating the landscape. Lower values preserve clear horizon illumination.
                  </p>
                  <p>
                    <strong className="text-stone-900">3. Atmospheric Visibility (20% weight):</strong> Converted from metres to kilometres (capped at 20 km for maximum points). Greater clarity ensures crisp contrast and rich tonal gradation across Singapore's waterways and cityscape.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ranked List of Shooting Spots */}
          <div id="ranked-spots-section">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Ranked Shooting Spots ({mode === 'sunset' ? 'West-Facing' : 'East-Facing'})
                </h3>
                <p className="text-xs text-stone-600">
                  Ranked best conditions first for {mode}. Click any row to inspect its exact figures above.
                </p>
              </div>
              <span className="text-xs text-stone-500 font-mono font-medium">
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
                    className={`cursor-pointer border rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
                      isSelected
                        ? mode === 'sunset'
                          ? 'bg-amber-50/90 border-orange-500/80 shadow-md ring-2 ring-orange-500/30'
                          : 'bg-rose-50/90 border-rose-500/80 shadow-md ring-2 ring-rose-500/30'
                        : 'bg-white border-stone-200 hover:bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    {/* Spot Name & Rank */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                          index === 0
                            ? mode === 'sunset'
                              ? 'bg-orange-600 text-white'
                              : 'bg-rose-500 text-white'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        #{index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-stone-900">
                            {spot.name}
                          </span>
                          {index === 0 && (
                            <span
                              className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
                                mode === 'sunset'
                                  ? 'bg-orange-100 text-orange-900 border-orange-300'
                                  : 'bg-rose-100 text-rose-900 border-rose-300'
                              }`}
                            >
                              Top Pick
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-600 flex items-center gap-1.5 mt-0.5">
                          <Compass className="w-3 h-3 text-stone-500" />
                          <span className="font-medium">Facing {spot.facing}</span>
                          <span className="text-stone-300">•</span>
                          <span>{spot.lat.toFixed(4)}, {spot.lon.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats: Score and low/mid/high cloud figures */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-200">
                      {/* Cloud Figures */}
                      <div className="flex items-center gap-3 text-xs text-stone-800">
                        <div className="text-center">
                          <span className="block text-[10px] uppercase text-stone-500 font-medium">Low</span>
                          <span className="font-mono font-semibold">{spot.raw.cloud_cover_low}%</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] uppercase text-stone-500 font-medium">Mid</span>
                          <span className="font-mono font-semibold">{spot.raw.cloud_cover_mid}%</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] uppercase text-stone-500 font-medium">High</span>
                          <span className="font-mono font-semibold">{spot.raw.cloud_cover_high}%</span>
                        </div>
                        <div className="text-center pl-1 border-l border-stone-200">
                          <span className="block text-[10px] uppercase text-stone-500 font-medium">Vis</span>
                          <span className="font-mono font-semibold">{spot.raw.visibility_km}km</span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div
                        className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-sm min-w-[56px] text-center shadow-sm ${
                          mode === 'sunset'
                            ? spot.score >= 65
                              ? 'bg-orange-600 text-white border-orange-500'
                              : spot.score >= 50
                              ? 'bg-amber-600 text-white border-amber-500'
                              : 'bg-stone-200 text-stone-800 border-stone-300'
                            : spot.score >= 65
                            ? 'bg-rose-500 text-white border-rose-400'
                            : spot.score >= 50
                            ? 'bg-amber-500 text-white border-amber-400'
                            : 'bg-stone-200 text-stone-800 border-stone-300'
                        }`}
                      >
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
