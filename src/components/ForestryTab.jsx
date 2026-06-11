import { useState, useRef } from 'react'
import { analyzeTrees } from '../api'
import styles from './ForestryTab.module.css'

export default function ForestryTab({ apiKey }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [showOverlay, setShowOverlay] = useState(false)

  const [siteId, setSiteId] = useState('')
  const [county, setCounty] = useState('')
  const [acres, setAcres] = useState('')
  const [notes, setNotes] = useState('')

  const fileRef = useRef()

  function handleFile(f) {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  function clearAll() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    setShowOverlay(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleAnalyze() {
    if (!apiKey) { setError('Enter a valid API key (starts with wai_) at the top.'); return }
    if (!file) { setError('Please select an image first.'); return }
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      const data = await analyzeTrees(apiKey, file, { siteId, county, acres, notes })
      setResult(data)
    } catch (e) {
      setError(e.message || 'Analysis failed. Check your key and image.')
    }
    setLoading(false)
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const r = result
  const health = r?.tree_health || {}
  const healthy = health.healthy || 0
  const care = health.needs_care || 0
  const replace = health.needs_replacement || 0
  const total = Math.max(healthy + care + replace, 1)
  const conf = r?.confidence_score ? Math.round(r.confidence_score * 100) : null

  return (
    <div className={styles.wrap}>
      <div className={styles.sectionLabel}>Optional metadata</div>
      <div className={styles.formRow}>
        <input className={styles.formInput} value={siteId} onChange={e => setSiteId(e.target.value)} placeholder="Site ID (optional)" />
        <input className={styles.formInput} value={county} onChange={e => setCounty(e.target.value)} placeholder="County / region" />
      </div>
      <div className={styles.formRow}>
        <input className={styles.formInput} value={acres} onChange={e => setAcres(e.target.value)} placeholder="Area (ha)" type="number" step="0.1" />
        <input className={styles.formInput} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (e.g. montane forest)" />
      </div>

      {!preview && (
        <div
          className={`${styles.uploadZone} ${dragging ? styles.drag : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
          <div className={styles.uploadIcon}>🛰️</div>
          <div className={styles.uploadLabel}>
            <strong>Drop a forest or tree cover image here</strong><br />
            Drone · Aerial · Satellite<br />
            JPEG · PNG · WEBP · max 20 MB
          </div>
        </div>
      )}

      {preview && (
        <>
          <div className={styles.imageWrap}>
            <img
              src={showOverlay && r?.overlay_image_url ? r.overlay_image_url : preview}
              alt="Forest image"
              className={styles.previewImg}
            />
            {r?.overlay_image_url && (
              <button
                className={`${styles.toggleBtn} ${showOverlay ? styles.toggleActive : ''}`}
                onClick={() => setShowOverlay(v => !v)}
              >
                {showOverlay ? 'Show original' : 'Show overlay'}
              </button>
            )}
          </div>

          <div className={styles.actionRow}>
            <button className={styles.btn} onClick={handleAnalyze} disabled={loading}>
              {loading ? 'Analyzing…' : 'Analyze Image'}
            </button>
            <button className={styles.btnOutline} onClick={clearAll}>Clear</button>
          </div>
        </>
      )}

      {error && <div className={styles.error}>⚠ {error}</div>}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span className={styles.loadingText}>Running CV + AI analysis…</span>
        </div>
      )}

      {r && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <div className={styles.sectionLabel} style={{ margin: 0 }}>Results</div>
            {conf !== null && <span className={styles.confBadge}>🎯 {conf}% confidence</span>}
          </div>

          {r.tree_species_guess && (
            <div className={styles.speciesRow}>
              Species estimate: <span className={styles.speciesVal}>{r.tree_species_guess}</span>
            </div>
          )}

          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <div className={styles.bigNum}>{r.total_tree_count ?? '—'}</div>
              <div className={styles.statLabel}>Trees detected</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.bigNum} style={{ fontSize: 28 }}>
                {r.canopy_coverage_pct != null ? r.canopy_coverage_pct.toFixed(1) : '—'}%
              </div>
              <div className={styles.statLabel}>Canopy coverage</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.bigNum} style={{ fontSize: 28 }}>
                {r.tree_density_per_acre != null ? r.tree_density_per_acre.toFixed(1) : '—'}
              </div>
              <div className={styles.statLabel}>Trees / acre</div>
            </div>
            <div className={styles.statBox}>
              <div className={styles.bigNum} style={{ fontSize: 28, color: 'var(--green)' }}>{healthy}</div>
              <div className={styles.statLabel}>Healthy trees</div>
            </div>
          </div>

          <div className={styles.healthCard}>
            <div className={styles.healthTitle}>Canopy health breakdown</div>
            {[
              { label: 'Healthy', count: healthy, color: 'var(--green)' },
              { label: 'Needs care', count: care, color: 'var(--amber)' },
              { label: 'Needs replacement', count: replace, color: 'var(--red)' },
            ].map(({ label, count, color }) => (
              <div key={label} className={styles.healthRow}>
                <div className={styles.healthDot} style={{ background: color }} />
                <div className={styles.healthName}>{label}</div>
                <div className={styles.barBg}>
                  <div className={styles.bar} style={{ width: `${(count / total * 100).toFixed(0)}%`, background: color }} />
                </div>
                <div className={styles.healthCount} style={{ color }}>{count}</div>
              </div>
            ))}
          </div>

          {r.observations?.length > 0 && (
            <div className={styles.obsCard}>
              <div className={styles.obsTitle}>AI Observations</div>
              {r.observations.map((o, i) => (
                <div key={i} className={styles.obsItem}>{o}</div>
              ))}
            </div>
          )}

          {r.recommendations?.length > 0 && (
            <div className={styles.obsCard}>
              <div className={styles.obsTitle}>Recommendations</div>
              {r.recommendations.map((rec, i) => (
                <div key={i} className={styles.recItem}>
                  <span className={styles.recBullet}>→</span>{rec}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}