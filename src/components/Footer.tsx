import { ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer
      id="app-footer"
      className="mt-12 pt-8 pb-12 border-t border-zinc-800/80 text-xs text-zinc-400 text-center space-y-3"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
        {/* Mandatory Credit 1 */}
        <a
          id="credit-open-meteo"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-zinc-400 hover:text-amber-400 transition-colors"
        >
          <span>Weather data by Open-Meteo.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <span className="hidden sm:inline text-zinc-700">•</span>

        {/* Mandatory Credit 2 */}
        <a
          id="credit-nasa-apod"
          href="https://apod.nasa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-zinc-400 hover:text-indigo-400 transition-colors"
        >
          <span>Astronomy Picture of the Day courtesy of NASA</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <p className="text-[11px] text-zinc-500">
        Afterglow Singapore — Decision tool for sunrise & sunset photographers.
      </p>
    </footer>
  );
}
