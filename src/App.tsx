import { useState, useEffect, useCallback } from 'react';
import { Mode, SkyApiResponse, ApodApiResponse } from './types';
import { TonightSection } from './components/TonightSection';
import { NasaSection } from './components/NasaSection';
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500 selection:text-zinc-950 antialiased font-sans">
      {/* Background atmospheric gradient */}
      <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-950/30 via-zinc-950 to-zinc-950" />

      {/* Main Single-Screen Container */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* App Header */}
        <header id="app-header" className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-800/80 pb-6">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Afterglow
                <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/50">
                  Singapore
                </span>
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Golden hour decision tool for sunrise & sunset photographers
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right text-xs text-zinc-400 italic mt-2 sm:mt-0 max-w-sm">
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
            data={nasaData}
            loading={nasaLoading}
            errorState={nasaError}
            onRetry={fetchNasaData}
          />
        </main>

        {/* SECTION 9 - Dual Source Credit Footer */}
        <Footer />
      </div>
    </div>
  );
}
