import { useEffect } from 'react';
import { Mode } from '../types';
import { MessageSquare } from 'lucide-react';

interface DisqusCommentsProps {
  mode?: Mode;
}

declare global {
  interface Window {
    disqus_config?: (this: {
      page: {
        url: string;
        identifier: string;
      };
    }) => void;
    DISQUS?: {
      reset: (options: {
        reload: boolean;
        config?: (this: {
          page: {
            url: string;
            identifier: string;
          };
        }) => void;
      }) => void;
    };
  }
}

export function DisqusComments({ mode = 'sunset' }: DisqusCommentsProps) {
  useEffect(() => {
    const disqusShortname = 'afterglow-sg';
    const disqusUrl = 'https://afterglow-sage.vercel.app';
    const disqusIdentifier = 'home';

    window.disqus_config = function () {
      this.page.url = disqusUrl;
      this.page.identifier = disqusIdentifier;
    };

    // Guardrail: Load the Disqus embed script only once, even when the component re-renders
    if (document.getElementById('disqus-script')) {
      if (window.DISQUS) {
        window.DISQUS.reset({
          reload: true,
          config: function () {
            this.page.url = disqusUrl;
            this.page.identifier = disqusIdentifier;
          },
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'disqus-script';
    script.src = `https://${disqusShortname}.disqus.com/embed.js`;
    script.setAttribute('data-timestamp', String(+new Date()));
    script.async = true;
    (document.head || document.body).appendChild(script);
  }, []);

  return (
    <section
      id="disqus-feedback-section"
      className="bg-white/95 border border-stone-200/80 rounded-2xl p-6 sm:p-8 shadow-xl shadow-stone-200/60 backdrop-blur-sm mt-8 transition-colors duration-400"
    >
      <div className="flex items-center gap-2.5 border-b border-stone-200 pb-4 mb-6">
        <MessageSquare
          className={`w-5 h-5 transition-colors duration-400 ${
            mode === 'sunset' ? 'text-orange-600' : 'text-rose-500'
          }`}
        />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            Community Feedback
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5 font-medium">
            Tell us what worked for you and what did not.
          </p>
        </div>
      </div>

            <div
        id="disqus_thread"
        className="min-h-[160px]"
        style={{ color: 'rgb(28, 25, 23)', backgroundColor: 'rgb(255, 255, 255)' }}
      />
    </section>
  );
}
