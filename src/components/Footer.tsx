import { ExternalLink } from 'lucide-react';
import { Mode } from '../types';

interface FooterProps {
  mode?: Mode;
}

export function Footer({ mode = 'sunset' }: FooterProps) {
  return (
    <footer
      id="app-footer"
      className="mt-12 pt-8 pb-12 border-t border-stone-200/80 text-xs text-stone-600 text-center space-y-3 transition-colors duration-400"
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6">
        {/* Mandatory Credit 1 */}
        <a
          id="credit-open-meteo"
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-stone-600 font-medium transition-colors ${
            mode === 'sunset' ? 'hover:text-orange-600' : 'hover:text-rose-600'
          }`}
        >
          <span>Weather data by Open-Meteo.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        <span className="hidden sm:inline text-stone-300">•</span>

        {/* Mandatory Credit 2 */}
        <a
          id="credit-nasa-apod"
          href="https://apod.nasa.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-stone-600 font-medium transition-colors ${
            mode === 'sunset' ? 'hover:text-orange-600' : 'hover:text-rose-600'
          }`}
        >
          <span>Astronomy Picture of the Day courtesy of NASA</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <p className="text-[11px] text-stone-500 font-medium">
        Afterglow Singapore — Decision tool for sunrise & sunset photographers.
      </p>
    </footer>
  );
}
