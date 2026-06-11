const BASE = '/weatherai'

export async function geocodeCity(city) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.length) throw new Error('Location not found. Try a different city name.')
  const { lat, lon, display_name } = data[0]
  const parts = display_name.split(',')
  return {
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    city: parts[0].trim(),
    country: parts[parts.length - 1].trim(),
  }
}

export async function fetchWeather(apiKey, lat, lon) {
  const url = `${BASE}/v1/weather?lat=${lat}&lon=${lon}&days=7&ai=true&units=metric`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function analyzeTrees(apiKey, file, meta = {}) {
  const form = new FormData()
  form.append('image', file)
  if (meta.siteId)  form.append('siteId', meta.siteId)
  if (meta.county)   form.append('county', meta.county)
  if (meta.acres)    form.append('landAcres', meta.acres)
  if (meta.notes)    form.append('notes', meta.notes)
  if (meta.location) form.append('location', meta.location)

  const res = await fetch(`${BASE}/v1/trees/analyze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export function weatherIcons(code) {
  if (!code) return '🌤'
  const c = String(code)
  if (c.startsWith('2')) return '⛈️'
  if (c.startsWith('3')) return '🌦'
  if (c.startsWith('5')) return '🌧'
  if (c.startsWith('6')) return '❄️'
  if (c.startsWith('7')) return '🌫'
  if (c === '800') return '☀️'
  if (c.startsWith('80')) return '⛅'
  return '🌤'
}

export function isValidKey(key) {
  return key && key.startsWith('wai_') && key.length > 10
}