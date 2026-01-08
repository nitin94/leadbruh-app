# Leadbruh

Zero-friction lead capture for trade shows. Voice notes, business cards, typed notes → structured leads → export to CSV/Excel.

## Features

- 🎤 **Voice capture** — Speak naturally, AI extracts lead info
- 📷 **Card capture** — Snap a photo, AI reads the card
- ⌨️ **Text notes** — Quick typed notes when needed
- 📱 **Mobile-first PWA** — Installable, works offline
- 💾 **Local storage** — Data stays on your device
- 📊 **Export** — CSV or Excel, anytime

## Architecture

```
Browser (React PWA)
    ↓
Supabase Edge Functions (API proxy)
    ↓
OpenAI APIs (Whisper, GPT-4o, GPT-4o-mini)
```

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd leadbruh
npm install
```

### 2. Set up Supabase Edge Functions

You need the Supabase CLI installed:

```bash
npm install -g supabase
```

Login and link your project:

```bash
supabase login
supabase link --project-ref ciqheaowpesxsytocarh
```

Set your OpenAI API key as a secret:

```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here
```

Deploy the edge functions:

```bash
supabase functions deploy transcribe
supabase functions deploy extract-card
supabase functions deploy extract-lead
```

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173 on your phone (same WiFi network) or use the browser.

### 4. Build for production

```bash
npm run build
```

Deploy the `dist/` folder to any static hosting (Vercel, Netlify, Cloudflare Pages, etc.)

## Supabase Edge Functions

Three functions handle AI processing:

| Function | Purpose | Model |
|----------|---------|-------|
| `/transcribe` | Voice → text | Whisper |
| `/extract-card` | Card image → structured data | GPT-4o |
| `/extract-lead` | Text → structured data | GPT-4o-mini |

### Testing functions locally

```bash
supabase functions serve
```

Then update `src/lib/api.js` to point to `http://localhost:54321/functions/v1` during development.

## Environment Variables

### Frontend (.env.local)

```
VITE_SUPABASE_URL=https://ciqheaowpesxsytocarh.supabase.co
```

### Supabase Secrets

```
OPENAI_API_KEY=sk-...
```

## Cost Estimate

| Action | API | Cost |
|--------|-----|------|
| Voice note (30s) | Whisper | ~$0.003 |
| Text extraction | GPT-4o-mini | ~$0.001 |
| Card OCR | GPT-4o | ~$0.01 |

**Per lead: ~$0.01-0.02**

100 leads at a trade show ≈ $1-2

## Project Structure

```
leadbruh/
├── src/
│   ├── App.jsx              # Main app component
│   ├── App.css              # All styles
│   ├── main.jsx             # Entry point
│   ├── components/          # UI components
│   │   ├── CaptureTab.jsx
│   │   ├── LeadsTab.jsx
│   │   ├── RecordingOverlay.jsx
│   │   ├── CameraOverlay.jsx
│   │   ├── TextInputOverlay.jsx
│   │   ├── ExportModal.jsx
│   │   └── Toast.jsx
│   ├── hooks/               # React hooks
│   │   ├── useRecorder.js
│   │   ├── useCamera.js
│   │   └── useLeads.js
│   └── lib/                 # Utilities
│       ├── api.js           # Supabase API client
│       ├── db.js            # IndexedDB (Dexie)
│       ├── export.js        # CSV/Excel export
│       └── offlineQueue.js  # Offline capture queue
├── supabase/
│   └── functions/           # Edge functions
│       ├── transcribe/
│       ├── extract-card/
│       └── extract-lead/
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## Offline Support

- All captures are stored locally in IndexedDB
- If offline, captures are queued and processed when back online
- The app works fully offline (except AI processing)
- PWA can be installed on home screen

## Browser Support

- iOS Safari 15+
- Chrome Mobile 90+
- Firefox Mobile
- Samsung Internet

Requires:
- MediaRecorder API (voice)
- getUserMedia (camera)
- IndexedDB (storage)
- Service Worker (PWA)

## License

MIT
