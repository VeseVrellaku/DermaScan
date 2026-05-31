# DermaScan Unified Frontend

Single React application combining:

- **Marketing site** (`/`) from `front-end`
- **Patient & admin portal** (`/app`) from `frontendd`
- **AI Doctor voice assistant** (LiveKit) from `frontend-ai-doctor`

## Backends

| Service | Default URL | Proxy path |
|---------|-------------|------------|
| Main API (`backend-mvc`) | `http://localhost:8000` | `/api/mvc` |
| AI Doctor (`backend-ai-doctor`) | `http://localhost:8001` | `/api/ai-doctor` |

Copy `.env.example` to `.env` and set `VITE_LIVEKIT_URL`.

## Run

```bash
npm install
npm run dev
```

- Marketing: http://localhost:5173/
- Portal: http://localhost:5173/app

## Build

```bash
npm run build
npm run preview
```

## Legacy folders

The original folders (`front-end`, `frontendd`, `frontend-ai-doctor`) are kept for reference but superseded by this unified `frontend/` project.
