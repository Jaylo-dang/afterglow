import { useState } from 'react';
import { ApodApiResponse } from '../types';
import { Sparkles, ExternalLink, Video, AlertCircle, RefreshCw } from 'lucide-react';

interface NasaSectionProps {
  data: ApodApiResponse | null;
  loading: boolean;
  errorState: {
    type: 'none' | 'loading' | 'missingKey' | 'upstreamRefused' | 'unreachable' | 'other';
    message: string;
    status?: number;
  };
  onRetry: () => void;
}

export function NasaSection({ data, loading, errorState, onRetry }: NasaSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      id="nasa-section"
      className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md mt-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5 mb-6">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white">
              Tonight's sky, from NASA
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Astronomy Picture of the Day (APOD)
            </p>
          </div>
        </div>

        {data?.date && !loading && (
          <span className="text-xs font-mono bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-2.5 py-1 rounded-full">
            {data.date}
          </span>
        )}
      </div>

      {/* Case A: Loading */}
      {loading && (
        <div id="nasa-loading-state" className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-zinc-300 font-medium text-base">
            Contacting NASA Astronomy Picture of the Day service...
          </p>
          <p className="text-zinc-500 text-xs mt-2">Connecting to api.nasa.gov planetary/apod</p>
        </div>
      )}

      {/* Case C: Upstream refused or Missing Key */}
      {!loading && (errorState.type === 'missingKey' || errorState.type === 'upstreamRefused') && (
        <div id="nasa-refused-state" className="p-6 bg-zinc-950/80 border border-zinc-800 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-zinc-200 text-sm sm:text-base font-medium">
            {errorState.type === 'missingKey'
              ? 'NASA APOD service is unavailable: NASA_API_KEY environment variable is not configured.'
              : errorState.message || 'NASA APOD upstream request was refused.'}
          </p>
          <p className="text-zinc-400 text-xs mt-2">
            The weather section above remains fully functional. You can provide a NASA_API_KEY secret in your Vercel or environment settings.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors border border-zinc-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check again
          </button>
        </div>
      )}

      {/* Case D: Upstream unreachable */}
      {!loading && errorState.type === 'unreachable' && (
        <div id="nasa-unreachable-state" className="p-6 bg-red-950/20 border border-red-800/40 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="text-red-200 text-sm sm:text-base font-medium">
            Unable to connect to NASA APOD service. Network connection could not be established.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors border border-zinc-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry connection
          </button>
        </div>
      )}

      {/* Main Success Content */}
      {!loading && errorState.type === 'none' && data && (
        <div id="nasa-content-card" className="space-y-5">
          {/* Title */}
          <div>
            <h3 id="nasa-title" className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {data.title}
            </h3>
          </div>

          {/* Media Rendering: Only <img> when media_type is "image" */}
          {data.media_type === 'image' && data.url && (
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950/80">
              <img
                id="nasa-image"
                src={data.url}
                alt={data.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-[540px] object-cover sm:object-contain mx-auto transition-transform duration-500 hover:scale-[1.01]"
                loading="lazy"
              />
            </div>
          )}

          {/* Media Rendering: When media_type is "video" */}
          {data.media_type === 'video' && (
            <div id="nasa-video-box" className="p-6 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-950/80 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Today's picture is a video.
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  NASA APOD provided video media for this date.
                </p>
              </div>
              <a
                id="nasa-video-link"
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow"
              >
                <span>Watch Video on Upstream Provider</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Conditional Credit Line (MANDATORY GUARDRAIL) */}
          {/* When present: "Image: " + cleaned copyright; When absent: "Image: NASA" */}
          <div id="nasa-credit-line" className="text-xs text-zinc-400 font-medium italic">
            {data.credit || 'Image: NASA'}
          </div>

          {/* Explanation Truncated to about 3 lines with read more toggle */}
          <div className="pt-2 border-t border-zinc-800/60">
            <p
              id="nasa-explanation"
              className={`text-xs sm:text-sm text-zinc-300 leading-relaxed ${
                isExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {data.explanation}
            </p>
            {data.explanation && data.explanation.length > 180 && (
              <button
                id="nasa-read-more-toggle"
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors focus:outline-none"
              >
                {isExpanded ? 'Read less' : 'Read more'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
