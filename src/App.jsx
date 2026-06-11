import { useState } from 'react'
import WeatherTab from './components/WeatherTab'
import ForestryTab from './components/ForestryTab'
import { isValidKey } from './api'
import styles from './App.module.css'

export default function App() {
  const [apiKey, setApiKey] = useState('')
  const [tab, setTab] = useState('weather')

  const keyValid = isValidKey(apiKey)

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <div className={styles.brand}>WeatherAI<span className={styles.brandDot}>.</span></div>
            <div className={styles.tagline}>API INTEGRATION DEMO · Giovanni Tonucci</div>
          </div>
          <div className={`${styles.statusDot} ${keyValid ? styles.dotOk : ''}`} title={keyValid ? 'API key looks valid' : 'Waiting for API key'} />
        </div>

        <div className={styles.apiBar}>
          <input
            className={styles.apiInput}
            type="password"
            placeholder="wai_your_api_key_here"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </header>

      <nav className={styles.tabs}>
        <button className={`${styles.tab} ${tab === 'weather' ? styles.tabActive : ''}`} onClick={() => setTab('weather')}>
          🌤 Weather
        </button>
        <button className={`${styles.tab} ${tab === 'forestry' ? styles.tabActive : ''}`} onClick={() => setTab('forestry')}>
          🌲 Farm Analysis
        </button>
      </nav>

      <main className={styles.content}>
        {tab === 'weather'  && <WeatherTab apiKey={apiKey} />}
        {tab === 'forestry' && <ForestryTab apiKey={apiKey} />}
      </main>
    </div>
  )
}