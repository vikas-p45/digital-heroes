import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs an async loader on mount and whenever `deps` change. Exposes reload() and ignores stale responses. */
export default function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const run = useRef(0);

  const load = useCallback(async () => {
    const id = ++run.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      if (id === run.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === run.current) setState({ data: null, error, loading: false });
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}
