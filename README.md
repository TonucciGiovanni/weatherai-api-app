# WeatherAI API INTERGRATION

A mobile-first React app that integrates the [WeatherAI](https://weather-ai.co) API for live weather data, AI summaries, and forestry image analysis.

**[Live Demo](https://weatherai-api-app.vercel.app/)**


<img width="511" height="960" alt="image" src="https://github.com/user-attachments/assets/57c3634a-5845-4084-92b2-ca9b2ed0bf26" />



## Features

- **Live weather by city search** — enter any city name and get current conditions plus a 7-day forecast
- **GPS auto-location** — one-tap weather for your current position via browser geolocation
- **Celsius / Fahrenheit toggle** — switch display units without re-fetching data
- **7-day forecast with chart** — scrollable forecast cards plus a Recharts area chart for high/low trends
- **AI-powered weather summaries** — optional Gemini-generated insights from the WeatherAI API
- **Forestry image analysis** — upload aerial or satellite images for tree count, canopy health, and AI recommendations


## Tech Stack

- React 18
- Vite
- Recharts
- WeatherAI API
- Nominatim Geocoding API


## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

Paste your WeatherAI API key (starts with `wai_`) into the input at the top of the app. You can get a free key at https://weather-ai.co.


## API

This project uses two WeatherAI endpoints:

### Weather — `GET /v1/weather`

Fetches current conditions and a 7-day forecast for a given latitude and longitude. Query parameters include `days=7`, `ai=true` for an AI summary, and `units=metric`. City names are resolved to coordinates via the [Nominatim](https://nominatim.openstreetmap.org/) geocoding API.

### Tree Analysis — `POST /v1/trees/analyze`

Accepts a multipart form upload with a forest or tree-cover image (JPEG, PNG, or WEBP) and optional metadata (site ID, county, area, notes). Returns tree count, canopy coverage, health breakdown, species estimate, and AI-generated observations and recommendations.


## Deploying to Vercel

The project is configured for Vercel out of the box. In local development, Vite proxies API requests to avoid CORS. In production, `vercel.json` rewrites `/weatherai/*` to the WeatherAI API server-side. No environment variables are required — the API key is entered by the user at runtime.


## Author

**Giovanni Tonucci**

- [LinkedIn](https://www.linkedin.com/in/giovannitonucci)
- [GitHub](https://github.com/giovannitonucci)
