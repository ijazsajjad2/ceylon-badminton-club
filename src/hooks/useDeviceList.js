import { useCallback, useState } from 'react'

// Small, non-sensitive preferences. Failed persistence stays visible to the user.
export default function useDeviceList(key) {
  const [items, setItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '[]')
      return Array.isArray(saved) ? [...new Set(saved.filter(item => typeof item === 'string'))].slice(0, 100) : []
    } catch { return [] }
  })
  const [storageError, setStorageError] = useState(false)
  const replace = useCallback(next => {
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageError(false) }
    catch { setStorageError(true) }
    setItems(next)
  }, [key])
  const toggle = id => replace(items.includes(id) ? items.filter(item => item !== id) : [...items, id])
  return { items, toggle, reset: () => replace([]), storageError }
}
