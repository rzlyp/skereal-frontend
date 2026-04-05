# Skereal Frontend

React SPA for Skereal.io — upload dress sketches, track AI generation progress in real-time, and browse generated images.

## Tech Stack

- **Framework**: React 18 + Vite 5
- **Styling**: Tailwind CSS 3
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query v5
- **HTTP Client**: Axios
- **Real-time**: Socket.io client
- **Auth**: @react-oauth/google
- **File Upload**: react-dropzone

## Project Structure

```
src/
├── context/
│   └── AuthContext.jsx     # Auth state, login/logout
├── components/
│   ├── Layout.jsx          # Sidebar, header, nav
│   └── Skeleton.jsx        # Loading skeleton components
├── pages/
│   ├── LoginPage.jsx       # Google OAuth login
│   ├── DashboardPage.jsx   # Recent projects overview
│   ├── DressMakerPage.jsx  # Project gallery + create form
│   └── GalleryDetailPage.jsx # Version viewer + regenerate
├── hooks/
│   └── useGenerationStatus.js  # Socket-based generation state
├── services/
│   ├── api.js              # Axios instance with auth interceptor
│   └── socket.js           # Socket.io singleton + helpers
├── App.jsx                 # Routes + ProtectedRoute
├── main.jsx                # App bootstrap
└── index.css               # Tailwind directives + base styles
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (same as backend) |
| `VITE_API_URL` | Backend URL used for the dev proxy (default: `http://localhost:5000`) |

### 3. Start development server

```bash
npm run dev
```

App runs at http://localhost:5173. API requests are proxied to `VITE_API_URL`.

## Scripts

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build (outputs to dist/)
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
npm run format    # Run Prettier
```

## Pages

| Route | Component | Description |
|---|---|---|
| `/login` | LoginPage | Google One Tap login |
| `/` | DashboardPage | Recent projects grid |
| `/dress-maker` | DressMakerPage | All projects + create new |
| `/gallery/:projectId` | GalleryDetailPage | Version viewer + regenerate |

## Key Concepts

### Auth Flow
`AuthContext` checks `localStorage` for a JWT on load, fetches `/api/auth/me` to validate it, and exposes `user`, `login()`, and `logout()`. The Axios interceptor in `api.js` attaches the token to every request and redirects to `/login` on 401.

### Real-time Generation
`useGenerationStatus(projectId)` connects to Socket.io, joins the project room, and listens for `generation:status`, `generation:complete`, and `generation:error` events. On complete/error it invalidates the relevant TanStack Query caches so the UI refreshes automatically.

### Dev Proxy
Vite proxies `/api`, `/uploads`, and `/socket.io` to the backend URL configured in `VITE_API_URL`, so no CORS issues during development.
