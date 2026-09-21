import { useState, useEffect, useCallback } from 'react';
import { Mode, SkyApiResponse, ApodApiResponse } from './types';
import { TonightSection } from './components/TonightSection';
import { NasaSection } from './components/NasaSection';
import { DisqusComments } from './components/DisqusComments';
import { Footer } from './components/Footer';
import { Camera } from 'lucide-react';

export default function App() {
  // Mode toggle: Sunset selected by default
  const [mode, setMode] = useState<Mode>('sunset');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Weather section independent state
  const [weatherData, setWeatherData] = useState<SkyApiResponse | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<{
    type: 'none' | 'loading' | 'outOfRange' | 'upstreamRefused' | 'unreachable' | 'other';
    message: string;
  }>({ type: 'none', message: '' });

  // NASA section independent state
  const [nasaData, setNasaData] = useState<ApodApiResponse | null>(null);
  const [nasaLoading, setNasaLoading] = useState<boolean>(true);
  const [nasaError, setNasaError] = useState<{
    type: 'none' | 'loading' | 'missingKey' | 'upstreamRefused' | 'unreachable' | 'other';
    message: string;
    status?: number;
  }>({ type: 'none', message: '' });

  // Fetch sky data from /api/sky
  const fetchSkyData = useCallback(async (targetMode: Mode, dateQuery?: string) => {
    setWeatherLoading(true);
    setWeatherError({ type: 'none', message: '' });

    try {
      const url = new URL('/api/sky', window.location.origin);
      url.searchParams.set('mode', targetMode);
      if (dateQuery) {
        url.searchParams.set('date', dateQuery);
      }

      const res = await fetch(url.toString());

      // Non-2xx response handling
      if (!res.ok) {
        let errJson;
        try {
          errJson = await res.json();
        } catch {
          errJson = { message: res.statusText };
        }
        setWeatherError({
          type: 'upstreamRefused',
          message: errJson.message || `Open-Meteo returned HTTP ${res.status}: ${res.statusText}. Conditions cannot be calculated right now.`,
        });
        setWeatherLoading(false);
        return;
      }

      const json: SkyApiResponse = await res.json();

      // Case B: Forecast does not cover requested day
      if (json.outOfRange) {
        setWeatherError({
          type: 'outOfRange',
          message: json.message || 'The forecast does not cover the requested day, because the free tier only goes seven days ahead',
        });
      } else {
        setWeatherData(json);
        if (!selectedDate && json.date) {
          setSelectedDate(json.date);
        }
      }
    } catch (networkErr: any) {
      // Case D: Upstream could not be reached at all
      setWeatherError({
        type: 'unreachable',
        message: 'Unable to reach Open-Meteo weather service. Please check your internet connection or try again shortly.',
      });
    } finally {
      setWeatherLoading(false);
    }
  }, [selectedDate]);

  // Fetch NASA APOD data from /api/apod
  const fetchNasaData = useCallback(async () => {
    setNasaLoading(true);
    setNasaError({ type: 'none', message: '' });

    try {
      const res = await fetch('/api/apod');

      if (!res.ok) {
        let errJson;
        try {
          errJson = await res.json();
        } catch {
          errJson = { message: res.statusText };
        }

        if (res.status === 503 && errJson.message?.includes('NASA_API_KEY')) {
          setNasaError({
            type: 'missingKey',
            status: 503,
            message: 'NASA APOD service is unavailable: NASA_API_KEY environment variable is not configured.',
          });
        } else {
          setNasaError({
            type: 'upstreamRefused',
            status: res.status,
            message: errJson.message || `NASA APOD returned HTTP ${res.status}: ${res.statusText}`,
          });
        }
        setNasaLoading(false);
        return;
      }

      const json: ApodApiResponse = await res.json();
      setNasaData(json);
    } catch (networkErr: any) {
      // Case D: Upstream unreachable
      setNasaError({
        type: 'unreachable',
        message: 'Unable to connect to NASA APOD service. Network connection could not be established.',
      });
    } finally {
      setNasaLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSkyData(mode, selectedDate || undefined);
  }, [mode, selectedDate, fetchSkyData]);

  useEffect(() => {
    fetchNasaData();
  }, [fetchNasaData]);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <div
      className={`min-h-screen antialiased font-sans overflow-x-hidden transition-colors duration-400 ${
        mode === 'sunset'
          ? 'bg-[#faf6f0] text-stone-900 selection:bg-amber-500 selection:text-white'
          : 'bg-[#f8f6f3] text-stone-900 selection:bg-rose-400 selection:text-white'
      }`}
    >
      {/* Background atmospheric gradient */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-400 ${
          mode === 'sunset'
            ? 'opacity-70 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/50 via-orange-100/30 to-transparent'
            : 'opacity-70 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-200/50 via-amber-100/30 to-transparent'
        }`}
      />

      {/* Main Single-Screen Container */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* App Header */}
        <header
          id="app-header"
          className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-stone-200/80 pb-6"
        >
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all duration-400 ${
                mode === 'sunset'
                  ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-purple-700 shadow-orange-500/20'
                  : 'bg-gradient-to-br from-rose-400 via-peach-300 via-amber-300 to-amber-500 shadow-rose-400/20 text-stone-900'
              }`}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 flex items-center gap-2">
                Afterglow
                <span
                  className={`text-xs uppercase tracking-widest font-semibold px-2 py-0.5 rounded border transition-colors duration-400 ${
                    mode === 'sunset'
                      ? 'text-amber-900 bg-amber-100 border-amber-300'
                      : 'text-rose-900 bg-rose-100 border-rose-300'
                  }`}
                >
                  Singapore
                </span>
              </h1>
              <p className="text-xs text-stone-600 mt-0.5">
                Golden hour decision tool for sunrise & sunset photographers
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right text-xs text-stone-600 italic mt-2 sm:mt-0 max-w-sm">
            &ldquo;Decide before you leave the house whether tonight is worth carrying a tripod for, which spot to go to, and what time to be there.&rdquo;
          </div>
        </header>

        <main id="app-main-content">
          {/* SECTION 1 - "Tonight" (the main section) */}
          <TonightSection
            mode={mode}
            onModeChange={handleModeChange}
            data={weatherData}
            loading={weatherLoading}
            errorState={weatherError}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />

          {/* SECTION 2 - "Tonight's sky, from NASA" (independent failure) */}
          <NasaSection
            mode={mode}
            data={nasaData}
            loading={nasaLoading}
            errorState={nasaError}
            onRetry={fetchNasaData}
          />

          {/* Disqus Comments Section */}
          <DisqusComments mode={mode} />
        </main>

        {/* SECTION 9 - Dual Source Credit Footer */}
        <Footer mode={mode} />
      </div>
    </div>
  );
}
