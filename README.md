# CPRO Davao Web Application

A full-stack web application for Ceramic Pro Davao, featuring a public landing page and an admin dashboard for managing customers, appointments, inventory, employees, and finances.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| React Router v6 | Client-side routing |
| Tailwind CSS v4 | Styling |
| Framer Motion (`motion/react`) | Animations (landing page) |
| Recharts | Charts & graphs (dashboard) |
| Radix UI | Accessible UI primitives |
| Lucide React | Icons |
| Sonner | Toast notifications |
| clsx + tailwind-merge | Conditional class utilities |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime |
| Express | Web server framework |
| TypeScript | Type safety |
| ts-node | Run TypeScript directly |
| CORS | Cross-origin requests |

---

## Project Structure

```
CproWeb/
├── index.html
├── package.json
├── vite.config.ts
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
│
├── src/
│   ├── main.tsx               # App entry point
│   ├── App.tsx                # Root router
│   ├── index.css              # Global styles (Tailwind v4 compiled)
│   │
│   ├── components/
│   │   ├── ui/                # Landing page UI components (Radix-based)
│   │   ├── dashboard-ui/      # Dashboard UI components (separate to avoid conflicts)
│   │   ├── landing/           # Landing page components
│   │   └── dashboard/         # Dashboard components
│   │
│   ├── pages/
│   │   ├── LandingPage.tsx    # Landing page (route: /)
│   │   └── AdminDashboard.tsx # Admin dashboard (route: /admin)
│   │
│   └── styles/
│       ├── globals.css        # Landing page CSS variables
│       └── dashboard.css      # Dashboard CSS variables
│
└── server/
    ├── index.ts               # Express server entry point
    └── routes/
        └── auth.ts            # Authentication routes
```

---

## Routes

| URL | Page |
|---|---|
| `http://localhost:5173/` | Landing page |
| `http://localhost:5173/admin` | Admin dashboard |
| `http://localhost:3001/api/auth/login` | Login API endpoint |
| `http://localhost:3001/api/health` | Server health check |

---

## Getting Started

### Prerequisites
- Node.js v18 or higher
- npm v9 or higher

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd CproWeb

# Install all dependencies
npm install
```

### Running the App

You need **two terminal tabs** running at the same time:

**Terminal 1 — Frontend:**
```bash
npm run dev
```
Opens at `http://localhost:5173`

**Terminal 2 — Backend:**
```bash
npm run server
```
Runs at `http://localhost:3001`

---

## Login Credentials

Default admin credentials (hardcoded — change before deploying):

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend dev server |
| `npm run server` | Start Express backend |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build locally |

---

## Important Notes & Commands to Avoid Issues

### Always run `npm install` from the root directory
```bash
# CORRECT
cd /path/to/CproWeb
npm install

# WRONG - will fail
cd /path/to/CproWeb/src/pages
npm install
```

### Always start both servers when developing
The frontend (`npm run dev`) and backend (`npm run server`) must both be running at the same time. The login modal will show "Cannot connect to server" if the backend is not running.

### UI Components are intentionally separated
- Landing page components import from `../ui/`
- Dashboard components import from `../dashboard-ui/`

Do **not** merge these two folders — they have different styles and will conflict.

### Do not use `npx tailwindcss init` with this project
This project uses **Tailwind CSS v4** which does not use a `tailwind.config.js` in the traditional way. The CSS is pre-compiled in `src/index.css`.

### Environment variable for API URL
The backend URL is currently hardcoded as `http://localhost:3001` in `LoginModal.tsx`. Before deploying to production, replace it with an environment variable:

```ts
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
```

And create a `.env` file in the root:
```
VITE_API_URL=http://localhost:3001
```

---

## Deployment

### Frontend → Vercel
1. Push to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set environment variable `VITE_API_URL` to your backend URL

### Backend → Railway or Render
1. Push to GitHub
2. Create new project on [railway.app](https://railway.app) or [render.com](https://render.com)
3. Set start command to `npm run server`
4. Copy the deployed URL and set it as `VITE_API_URL` on Vercel

---

## Coming Soon
- [ ] JWT authentication (replace hardcoded credentials)
- [ ] PostgreSQL database with Prisma ORM
- [ ] Protected `/admin` route (redirect to login if not authenticated)
- [ ] Real data for customers, appointments, inventory, employees, finance
