import { useState } from 'react';
import { ApodApiResponse, Mode } from '../types';
import { Sparkles, ExternalLink, Video, AlertCircle, RefreshCw } from 'lucide-react';

interface NasaSectionProps {
  mode?: Mode;
  data: ApodApiResponse | null;
  loading: boolean;
  errorState: {
    type: 'none' | 'loading' | 'missingKey' | 'upstreamRefused' | 'unreachable' | 'other';
    message: string;
    status?: number;
  };
  onRetry: () => void;
}

export function NasaSection({ mode = 'sunset', data, loading, errorState, onRetry }: NasaSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      id="nasa-section"
      className="bg-white/95 border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-stone-200/60 backdrop-blur-sm mt-8 transition-colors duration-400"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-5 mb-6">
        <div className="flex items-center gap-2.5">
          <Sparkles
            className={`w-5 h-5 transition-colors duration-400 ${
              mode === 'sunset' ? 'text-orange-600' : 'text-rose-500'
            }`}
          />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
              Tonight's sky, from NASA
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5 font-medium">
              Astronomy Picture of the Day (APOD)
            </p>
          </div>
        </div>

        {data?.date && !loading && (
          <span className="text-xs font-mono bg-stone-100 text-stone-700 border border-stone-300 font-semibold px-2.5 py-1 rounded-full">
            {data.date}
          </span>
        )}
      </div>

      {/* Case A: Loading */}
      {loading && (
        <div id="nasa-loading-state" className="py-12 text-center">
          <div
            className={`inline-block w-8 h-8 border-2 rounded-full animate-spin mb-4 ${
              mode === 'sunset'
                ? 'border-orange-500/30 border-t-orange-600'
                : 'border-rose-400/30 border-t-rose-500'
            }`}
          />
          <p className="text-stone-800 font-semibold text-base">
            Contacting NASA Astronomy Picture of the Day service...
          </p>
          <p className="text-stone-600 text-xs mt-2 font-medium">Connecting to api.nasa.gov planetary/apod</p>
        </div>
      )}

      {/* Case C: Upstream refused or Missing Key */}
      {!loading && (errorState.type === 'missingKey' || errorState.type === 'upstreamRefused') && (
        <div id="nasa-refused-state" className="p-6 bg-stone-50 border border-stone-200 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
          <p className="text-stone-900 text-sm sm:text-base font-semibold">
            {errorState.type === 'missingKey'
              ? 'NASA APOD service is unavailable: NASA_API_KEY environment variable is not configured.'
              : errorState.message || 'NASA APOD upstream request was refused.'}
          </p>
          <p className="text-stone-600 text-xs mt-2">
            The weather section above remains fully functional. You can provide a NASA_API_KEY secret in your Vercel or environment settings.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg transition-colors border border-stone-300 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check again
          </button>
        </div>
      )}

      {/* Case D: Upstream unreachable */}
      {!loading && errorState.type === 'unreachable' && (
        <div id="nasa-unreachable-state" className="p-6 bg-red-50 border border-red-300 rounded-xl text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <p className="text-red-900 text-sm sm:text-base font-semibold">
            Unable to connect to NASA APOD service. Network connection could not be established.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-stone-100 text-stone-800 rounded-lg transition-colors border border-stone-300 shadow-sm"
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
            <h3 id="nasa-title" className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              {data.title}
            </h3>
          </div>

          {/* Media Rendering: Only <img> when media_type is "image" */}
          {data.media_type === 'image' && data.url && (
            <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-sm">
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
            <div id="nasa-video-box" className="p-6 rounded-xl border border-stone-200 bg-stone-50 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
              <div
                className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                  mode === 'sunset'
                    ? 'bg-amber-100 border-amber-300 text-amber-700'
                    : 'bg-rose-100 border-rose-300 text-rose-700'
                }`}
              >
                <Video className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-stone-900">
                  Today's picture is a video.
                </p>
                <p className="text-xs text-stone-600 mt-1 font-medium">
                  NASA APOD provided video media for this date.
                </p>
              </div>
              <a
                id="nasa-video-link"
                href={data.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors shadow ${
                  mode === 'sunset'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-rose-500 hover:bg-rose-600'
                }`}
              >
                <span>Watch Video on Upstream Provider</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Conditional Credit Line (MANDATORY GUARDRAIL) */}
          {/* When present: "Image: " + cleaned copyright; When absent: "Image: NASA" */}
          <div id="nasa-credit-line" className="text-xs text-stone-600 font-semibold italic">
            {data.credit || 'Image: NASA'}
          </div>

          {/* Explanation Truncated to about 3 lines with read more toggle */}
          <div className="pt-2 border-t border-stone-200">
            <p
              id="nasa-explanation"
              className={`text-xs sm:text-sm text-stone-700 leading-relaxed font-normal ${
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
                className={`mt-2 text-xs font-bold transition-colors focus:outline-none ${
                  mode === 'sunset'
                    ? 'text-orange-700 hover:text-orange-800'
                    : 'text-rose-600 hover:text-rose-700'
                }`}
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
