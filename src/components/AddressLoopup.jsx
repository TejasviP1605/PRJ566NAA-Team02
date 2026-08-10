import { useEffect, useRef, useState } from 'react'

function partsFromNominatim(item) {
  const a = item?.address ?? {}
  const streetParts = [a.house_number, a.road || a.pedestrian || a.street].filter(Boolean)
  return {
    street: streetParts.join(' ').trim(),
    unit: a.unit || a.suite || '',
    city: a.city || a.town || a.village || a.municipality || a.suburb || '',
    province: a.state || a.province || a.region || '',
    postalCode: a.postcode || '',
    country: a.country || '',
  }
}

export function formatAddressParts(parts) {
  const { street = '', unit = '', city = '', province = '', postalCode = '', country = '' } = parts || {}
  return [street, unit, city, province, postalCode, country].map((s) => s.trim()).filter(Boolean).join(', ')
}

export function partsFromDetails(details) {
  if (!details || typeof details !== 'object') {
    return { street: '', unit: '', city: '', province: '', postalCode: '', country: '' }
  }
  return {
    street: details.street || details.road || '',
    unit: details.unit || details.suite || '',
    city: details.city || details.town || details.village || '',
    province: details.province || details.state || '',
    postalCode: details.postalCode || details.postcode || '',
    country: details.country || '',
  }
}

/**
 * Address search (Nominatim) + structured fields: Street, Unit, City, Province.
 * Lookup only assists finding an address; values are stored via onChange into Supabase.
 */
export default function AddressLookup({
  value,
  parts: controlledParts,
  onChange,
  searchLabel = 'Search address',
  disabled = false,
  showUnit = true,
}) {
  const initial = partsFromDetails(controlledParts)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [street, setStreet] = useState(initial.street)
  const [unit, setUnit] = useState(initial.unit)
  const [city, setCity] = useState(initial.city)
  const [province, setProvince] = useState(initial.province)
  const [postalCode, setPostalCode] = useState(initial.postalCode)
  const [country, setCountry] = useState(initial.country)
  const abortRef = useRef(null)
  const containerRef = useRef(null)
  const skipSync = useRef(false)

  useEffect(() => {
    if (skipSync.current) {
      skipSync.current = false
      return
    }
    const next = partsFromDetails(controlledParts)
    setStreet(next.street)
    setUnit(next.unit)
    setCity(next.city)
    setProvince(next.province)
    setPostalCode(next.postalCode)
    setCountry(next.country)
    if (!controlledParts && value) setQuery(value)
  }, [controlledParts, value])

  const emit = (next) => {
    const parts = {
      street: next.street ?? street,
      unit: next.unit ?? unit,
      city: next.city ?? city,
      province: next.province ?? province,
      postalCode: next.postalCode ?? postalCode,
      country: next.country ?? country,
    }
    skipSync.current = true
    onChange?.({
      address: formatAddressParts(parts),
      addressDetails: parts,
      parts,
    })
  }

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([])
      setOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query.trim())}`
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        })
        if (!res.ok) throw new Error(`Nominatim ${res.status}`)
        const data = await res.json()
        if (!controller.signal.aborted) {
          setResults(Array.isArray(data) ? data : [])
          setOpen(true)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Address lookup failed:', err.message)
          setResults([])
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 500)

    return () => {
      clearTimeout(timer)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [query])

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (item) => {
    const parts = partsFromNominatim(item)
    setStreet(parts.street)
    setUnit(parts.unit)
    setCity(parts.city)
    setProvince(parts.province)
    setPostalCode(parts.postalCode)
    setCountry(parts.country)
    setQuery(item.display_name)
    setResults([])
    setOpen(false)
    emit(parts)
  }

  const fieldClass =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-slate-50'

  return (
    <div className="space-y-4">
      <div ref={containerRef} className="relative">
        <label htmlFor="address-search" className="text-sm text-slate-600">
          {searchLabel}
        </label>
        <input
          id="address-search"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (results.length) setOpen(true)
          }}
          placeholder="Start typing to search…"
          autoComplete="off"
          className={fieldClass}
        />

        {open && query.trim().length >= 3 && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
            {loading ? (
              <p className="px-3 py-2 text-sm text-slate-500">Searching…</p>
            ) : results.length > 0 ? (
              <ul className="max-h-60 overflow-auto">
                {results.map((item) => (
                  <li key={item.place_id}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelect(item)
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors"
                    >
                      {item.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-2 text-sm text-slate-500">No results — fill the fields below manually.</p>
            )}
            <p className="px-3 py-1.5 text-[11px] text-slate-400 border-t border-slate-100">
              Powered by OpenStreetMap Nominatim
            </p>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="addr-street" className="text-sm text-slate-600">
            Street address
          </label>
          <input
            id="addr-street"
            value={street}
            disabled={disabled}
            onChange={(e) => {
              setStreet(e.target.value)
              emit({ street: e.target.value })
            }}
            placeholder="e.g. 123 Main St"
            className={fieldClass}
          />
        </div>
        {showUnit && (
          <div>
            <label htmlFor="addr-unit" className="text-sm text-slate-600">
              Unit number
            </label>
            <input
              id="addr-unit"
              value={unit}
              disabled={disabled}
              onChange={(e) => {
                setUnit(e.target.value)
                emit({ unit: e.target.value })
              }}
              placeholder="e.g. 2B"
              className={fieldClass}
            />
          </div>
        )}
        <div>
          <label htmlFor="addr-city" className="text-sm text-slate-600">
            City
          </label>
          <input
            id="addr-city"
            value={city}
            disabled={disabled}
            onChange={(e) => {
              setCity(e.target.value)
              emit({ city: e.target.value })
            }}
            placeholder="e.g. Toronto"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="addr-province" className="text-sm text-slate-600">
            Province
          </label>
          <input
            id="addr-province"
            value={province}
            disabled={disabled}
            onChange={(e) => {
              setProvince(e.target.value)
              emit({ province: e.target.value })
            }}
            placeholder="e.g. Ontario"
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="addr-postal" className="text-sm text-slate-600">
            Postal code
          </label>
          <input
            id="addr-postal"
            value={postalCode}
            disabled={disabled}
            onChange={(e) => {
              setPostalCode(e.target.value)
              emit({ postalCode: e.target.value })
            }}
            placeholder="Optional"
            className={fieldClass}
          />
        </div>
      </div>
    </div>
  )
}
