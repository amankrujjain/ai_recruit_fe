import { useEffect, useState } from 'react';

/**
 * Shows a bootstrapping flag from mount until `load()` settles.
 * Always starts true so the first paint is skeleton (not empty/stretched UI),
 * even when Redux already has cached data or pending flags have not flipped yet.
 *
 * @param {() => unknown | Promise<unknown>} load
 * @param {unknown[]} deps
 */
export function usePageBootstrap(load, deps = []) {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let alive = true;
    setBooting(true);

    Promise.resolve()
      .then(() => load())
      .catch(() => {})
      .finally(() => {
        if (alive) setBooting(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns deps
  }, deps);

  return booting;
}
