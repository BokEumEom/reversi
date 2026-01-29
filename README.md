# Reversi

Classic Reversi (Othello) board game — play locally, against AI, or online with anyone in the world.

**Live**: [reversi-one.vercel.app](https://reversi-one.vercel.app)

## Features

- **3 Game Modes** — Local 2P, AI (Easy/Medium/Hard), Online multiplayer
- **Online Multiplayer** — Room codes, invite links, quick match, reconnection support
- **4 Languages** — English, Korean, Japanese, Chinese (auto-detected)
- **PWA** — Install on mobile, offline AI play
- **Sound & Haptics** — Web Audio API synthesized sounds, vibration feedback
- **Responsive** — Mobile-first, works on any screen size

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 3 |
| Backend | Cloudflare Workers, Durable Objects (WebSocket) |
| Hosting | Vercel (frontend), Cloudflare (backend) |
| i18n | react-i18next |
| PWA | vite-plugin-pwa, Workbox |

## Project Structure

```
src/
├── components/     # UI components (Board, Cell, Piece, PlayerPanel, etc.)
├── hooks/          # React hooks (useGameState, useAnimatedScore)
├── logic/          # Game rules (move validation, execution, scoring)
├── ai/             # AI strategies (minimax, greedy, random)
├── online/         # Online multiplayer (WebSocket, RoomLobby)
├── audio/          # Sound system (Web Audio API)
├── haptics/        # Vibration feedback
├── pwa/            # PWA install prompt
├── i18n/           # Internationalization (4 locales)
├── config/         # Constants
├── types/          # TypeScript types
└── styles/         # Global CSS + animations

workers/
└── src/            # Cloudflare Workers backend
    ├── index.ts        # Router
    ├── gameRoom.ts     # Game room Durable Object
    ├── matchmaking.ts  # Matchmaking Durable Object
    └── gameLogic.ts    # Server-side game logic
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Backend (optional, for online multiplayer)

```bash
cd workers
npm install
npm run dev       # Local dev
npm run deploy    # Deploy to Cloudflare
```

### Environment Variables

```
VITE_WS_URL=wss://your-worker.workers.dev
VITE_API_URL=https://your-worker.workers.dev
```

## License

MIT
