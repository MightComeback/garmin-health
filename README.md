# Garmin Health

Local-first Garmin Connect client for iOS/Android. Syncs your health data to a local SQLite database and displays it in a clean, native interface.

## Architecture

```
┌─────────────────┐     HTTP API      ┌──────────────────┐
│   Expo App      │ ◄────────────────►│  garmin-health-  │
│  (this repo)    │    port 17890     │     sync         │
└─────────────────┘                   │  (SQLite + API)  │
                                      └──────────────────┘
                                             │
                                             ▼
                                        Garmin Connect
```

## Features

- **Today Dashboard** — Steps, sleep, resting HR, body battery, HRV at a glance
- **Workouts** — Activity history with duration, distance, calories
- **Trends** — 30-day charts for steps, sleep, and heart rate
- **Local Sync** — Your data stays on your device (or local network)

## Setup

1. Install dependencies:
```bash
bun install
```

2. Start the sync service (in garmin-health-sync repo):
```bash
cd ../garmin-health-sync
bun run dev
```

3. Run the app:
```bash
bun expo start
```

## Environment

The app connects to `http://127.0.0.1:17890` by default (sync service port).

## Tech Stack

- Expo 54
- React Native 0.81
- TypeScript
- React Navigation (via expo-router)

## Development

All source is in `app/` using the Expo Router file-based routing convention.
