import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { geocodeCity, fetchWeather, weatherIcons } from '../api'
import styles from './WeatherTab.module.css'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
  const res = await fetch(url)
  const data = await res.json()
  const addr = data.address || {}
  const city = addr.city || addr.town || addr.village || 'Your location'
  const country = addr.country || ''
  return { lat, lon, city, country }
}

function toFahrenheit(c) {
  return Math.round((c * 9) / 5 + 32)
}

function displayTemp(celsius, units) {
  if (celsius === null || celsius === undefined || celsius === '—') return '—'
  const n = typeof celsius === 'number' ? celsius : parseFloat(celsius)
  if (Number.isNaN(n)) return '—'
  return units === 'F' ? toFahrenheit(n) : Math.round(n)
}

export default function WeatherTab({ apiKey }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [meta, setMeta] = useState(null)
  const [units, setUnits] = useState('C')

  const unitLabel = units === 'F' ? '°F' : '°C'

  async function handleSearch() {
    if (!apiKey) { setError('Enter a valid API key (starts with wai_) at the top.'); return }
    if (!query.trim()) { setError('Enter a city name.'); return }
    setError(null)
    setLoading(true)
    setData(null)
    try {
      const geo = await geocodeCity(query.trim())
      const weather = await fetchWeather(apiKey, geo.lat, geo.lon)
      setMeta(geo)
      setData(weather)
    } catch (e) {
      setError(e.message || 'Request failed. Check your API key and try again.')
    }
    setLoading(false)
  }

  function handleLocation() {
    if (!apiKey) { setError('Enter a valid API key (starts with wai_) at the top.'); return }
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      return
    }
    setError(null)
    setLoading(true)
    setData(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const geo = await reverseGeocode(latitude, longitude)
          const weather = await fetchWeather(apiKey, geo.lat, geo.lon)
          setMeta(geo)
          setData(weather)
        } catch (e) {
          setError(e.message || 'Could not fetch weather for your location.')
        }
        setLoading(false)
      },
      () => {
        setError('Location access denied. Please allow location permissions and try again.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const cur = data?.current || data?.current_weather || {}
  const daily = data?.daily || data?.forecast || data?.forecast_days || []
  const aiSummary = data?.ai_summary || data?.summary || data?.ai || ''

  const tempRaw = cur.temp !== undefined ? cur.temp : cur.temperature !== undefined ? cur.temperature : null
  const feelsRaw = cur.feels_like !== undefined ? cur.feels_like : null
  const temp = displayTemp(tempRaw, units)
  const feels = feelsRaw !== null ? displayTemp(feelsRaw, units) : null
  const humidity = cur.humidity ?? null
  const wind = cur.wind_speed !== undefined ? Math.round(cur.wind_speed) : cur.windspeed !== undefined ? Math.round(cur.windspeed) : null
  const uv = cur.uvi ?? cur.uv_index ?? null
  const vis = cur.visibility !== undefined ? (cur.visibility / 1000).toFixed(1) : null
  const desc = cur.weather?.[0]?.description || cur.condition || cur.description || ''
  const code = cur.weather?.[0]?.id || cur.weathercode || ''

  const chartData = daily.slice(0, 7).map((day, i) => {
    const dt = day.dt ? new Date(day.dt * 1000) : day.date ? new Date(day.date) : null
    const label = i === 0 ? 'Today' : dt ? DAY_NAMES[dt.getDay()] : `D${i + 1}`
    const hiRaw = day.temp?.max !== undefined ? day.temp.max : day.temp !== undefined ? day.temp : day.tempmax
    const loRaw = day.temp?.min !== undefined ? day.temp.min : day.tempmin
    return {
      day: label,
      high: hiRaw !== undefined ? displayTemp(hiRaw, units) : null,
      low: loRaw !== undefined ? displayTemp(loRaw, units) : null,
    }
  })

  return (
    <div className={styles.wrap}>
      <div className={styles.searchRow}>
        <input
          className={styles.input}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="City name, e.g. Nairobi"
        />
        <button className={styles.btn} onClick={handleSearch} disabled={loading}>
          {loading ? '...' : 'Search'}
        </button>
      </div>

      <div className={styles.toolbar}>
        <button className={styles.locBtn} onClick={handleLocation} disabled={loading}>
          📍 Use my location
        </button>
        <button
          className={styles.unitToggle}
          onClick={() => setUnits(u => (u === 'C' ? 'F' : 'C'))}
          title="Toggle temperature unit"
        >
          °{units === 'C' ? 'F' : 'C'}
        </button>
      </div>

      {error && <div className={styles.error}>⚠ {error}</div>}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Fetching weather data…</span>
        </div>
      )}

      {!loading && !data && !error && (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🌍</div>
          <p>Enter a city or use your location to pull live weather data with AI-powered insights.</p>
        </div>
      )}

      {data && meta && (
        <>
          <div className={styles.mainCard}>
            <div className={styles.mainTop}>
              <div>
                <div className={styles.cityName}>{meta.city}</div>
                <div className={styles.cityMeta}>
                  {meta.country} · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
                <div className={styles.condition}>{weatherIcons(code)} {desc}</div>
              </div>
              <div className={styles.tempBlock}>
                <span className={styles.tempBig}>{temp ?? '—'}</span>
                <span className={styles.tempUnit}>{unitLabel}</span>
                {feels !== null && <div className={styles.feelsLike}>Feels {feels}°</div>}
              </div>
            </div>

            <div className={styles.statsGrid}>
              {humidity !== null && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>💧 Humidity</div>
                  <div className={styles.statVal}>{humidity}<span>%</span></div>
                </div>
              )}
              {wind !== null && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>💨 Wind</div>
                  <div className={styles.statVal}>{wind}<span> m/s</span></div>
                </div>
              )}
              {uv !== null && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>☀️ UV Index</div>
                  <div className={styles.statVal}>{uv}</div>
                </div>
              )}
              {vis !== null && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>👁 Visibility</div>
                  <div className={styles.statVal} style={{ fontSize: 14 }}>{vis} km</div>
                </div>
              )}
            </div>
          </div>

          {aiSummary && (
            <div className={styles.aiCard}>
              <div className={styles.aiLabel}>AI Summary</div>
              <p className={styles.aiText}>{aiSummary}</p>
            </div>
          )}

          {daily.length > 0 && (
            <>
              <div className={styles.sectionLabel}>7-day forecast</div>
              <div className={styles.forecastRow}>
                {daily.slice(0, 7).map((day, i) => {
                  const dt = day.dt ? new Date(day.dt * 1000) : day.date ? new Date(day.date) : null
                  const label = i === 0 ? 'Today' : dt ? DAY_NAMES[dt.getDay()] : `D${i + 1}`
                  const hiRaw = day.temp?.max !== undefined ? day.temp.max : day.temp !== undefined ? day.temp : day.tempmax
                  const loRaw = day.temp?.min !== undefined ? day.temp.min : day.tempmin
                  const hi = hiRaw !== undefined ? displayTemp(hiRaw, units) : '—'
                  const lo = loRaw !== undefined ? displayTemp(loRaw, units) : '—'
                  const dc = day.weather?.[0]?.id || day.weathercode || ''
                  return (
                    <div key={i} className={`${styles.fcItem} ${i === 0 ? styles.fcToday : ''}`}>
                      <div className={styles.fcDay}>{label}</div>
                      <div className={styles.fcIcon}>{weatherIcons(dc)}</div>
                      <div className={styles.fcHi}>{hi}°</div>
                      <div className={styles.fcLo}>{lo}°</div>
                    </div>
                  )
                })}
              </div>

              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="highGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="lowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={{ stroke: '#334155' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      unit="°"
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#e2e8f0',
                      }}
                      formatter={(value) => [`${value}°${units}`, undefined]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="high"
                      name="High"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fill="url(#highGrad)"
                      dot={{ r: 3, fill: '#f59e0b' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="low"
                      name="Low"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      fill="url(#lowGrad)"
                      dot={{ r: 3, fill: '#60a5fa' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}