import { useState, useEffect, useCallback } from 'react'

// Generic async-data hook. Usage:
//   const { data, loading, error, reload } = useAsync(() => getAssignedDeliveries(), [])
// `deps` works like useEffect deps — include anything the fetcher closes over (e.g. an id).
export function useAsync(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setError(null)
    fetcher()
      .then((result) => { if (!cancelled) setData(result) })
      .catch((err) => { if (!cancelled) setError(err) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return { data, loading, error, reload }
}
