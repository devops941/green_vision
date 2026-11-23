import { useEffect } from 'react';

/**
 * useScrollReveal
 *
 * Uses IntersectionObserver to add `is-visible` to every element carrying
 * the class `reveal-on-scroll` once it enters the viewport.  Reveals once
 * (no re-hide) and unobserves the element immediately after.
 *
 * @param {any[]} deps - Optional dependency array that re-triggers the scan
 *                       (e.g. pass [someLoadedState] if content renders later).
 */
const useScrollReveal = (deps = []) => {
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll('.reveal-on-scroll:not(.is-visible)')
    );

    // Fallback for environments without IntersectionObserver (SSR / old browsers)
    if (typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    targets.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, deps);
};

export default useScrollReveal;
