# PipFactor Frontend

AI-powered market intelligence platform frontend built with React, TypeScript, and modern web technologies.

## Project Stack

This project is built with:

- **Vite** — Fast build tool and dev server
- **TypeScript** — Type-safe JavaScript
- **React** — UI framework
- **shadcn-ui** — High-quality component library
- **Tailwind CSS** — Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js & npm installed — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation & Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd ai-trading_frontend

# Install dependencies
npm install

# Start the development server with hot-reload
npm run dev
```

The dev server will start at `http://localhost:3000` by default.

### Building for Production

```sh
# Create optimized production build
npm run build

# Preview the production build locally
npm run preview
```

## Project Structure

```
src/
├── components/        # React components
│   ├── marketing/     # Public-facing components (Navbar, Footer, etc.)
│   ├── auth/          # Authentication components
│   ├── signal/        # Signal display components
│   └── ui/            # Reusable UI components
├── pages/             # Page components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and helpers
├── services/          # API and external service integrations
├── types/             # TypeScript type definitions
└── main.tsx           # Application entry point
```

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run preview` — Preview production build
- `npm run lint` — Run ESLint

## Environment Variables

This frontend follows an environment-file split model.

- `.env.local` for localhost development (first-class local defaults)
- `.env.production` for production builds/deployments
- `.env.dev` reserved for remote dev (`*.dev.pipfactor.com`) when introduced

Runtime URL behavior is env-driven only:

- `VITE_API_BASE_URL` controls API requests
- `VITE_API_SSE_URL` controls SSE requests
- `VITE_AUTH_CALLBACK_URL_DEV` is preferred for local/dev auth callback redirects
- `VITE_AUTH_CALLBACK_URL_PROD` is preferred for production auth callback redirects
- `VITE_AUTH_CALLBACK_URL` is the legacy single-value fallback for both environments
- Redirect precedence: production build uses `VITE_AUTH_CALLBACK_URL_PROD`, local/dev uses `VITE_AUTH_CALLBACK_URL_DEV`, then falls back to `VITE_AUTH_CALLBACK_URL`, then runtime origin + `/auth/callback` (or `http://localhost:3000/auth/callback` when `window` is unavailable)
- Browser hostname is not used for automatic production API/SSE overrides
- `VITE_ALLOWED_HOSTS` can be set per environment; local development can leave it unset

### Local startup expectations

1. Use `.env.local` values that point to localhost services:

```env
VITE_ENV_NAME=local
VITE_PUBLIC_APP_URL=http://localhost:3000
VITE_PUBLIC_SITE_URL=http://localhost:3000
VITE_AUTH_CALLBACK_URL_DEV=http://localhost:3000/auth/callback
VITE_AUTH_CALLBACK_URL=http://localhost:3000/auth/callback
VITE_API_BASE_URL=http://localhost:8080
VITE_API_SSE_URL=http://localhost:8081
VITE_SESSION_COOKIE_NAME=session
VITE_CSRF_COOKIE_NAME=csrf_token
VITE_TURNSTILE_SITE_KEY_DEV=1x00000000000000000000AA
```

2. Start dev server with `npm run dev`.
3. Verify frontend API calls target `http://localhost:8080` and SSE targets `http://localhost:8081`.

### Production expectations

Set real production values in `.env.production` (no secrets in frontend files):

```env
VITE_ENV_NAME=production
VITE_PUBLIC_APP_URL=https://pipfactor.com
VITE_PUBLIC_SITE_URL=https://pipfactor.com
VITE_AUTH_CALLBACK_URL_PROD=https://pipfactor.com/auth/callback
VITE_AUTH_CALLBACK_URL=https://pipfactor.com/auth/callback
VITE_API_BASE_URL=https://api.your-domain.com
VITE_API_SSE_URL=https://sse.your-domain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
VITE_TURNSTILE_SITE_KEY_PROD=your-cloudflare-turnstile-site-key
```

Build using the production env file explicitly:

```sh
npm run build -- --mode production
```

## Supabase + Turnstile Setup Checklist

Use this checklist to enable captcha-protected login/signup with Supabase Auth:

1. In Supabase Dashboard, go to `Authentication -> Bot and Abuse Protection` and enable captcha for email/password auth flows.
2. Select `Cloudflare Turnstile` as provider.
3. Paste your Turnstile `site key` and `secret key` into Supabase Dashboard fields.
4. Set `VITE_TURNSTILE_SITE_KEY_DEV` for local/dev and `VITE_TURNSTILE_SITE_KEY_PROD` for production (`VITE_TURNSTILE_SITE_KEY` remains a legacy fallback).
5. Never expose the Turnstile `secret key` in frontend code, Vite env (`VITE_*`), or git commits.
6. Rebuild/redeploy frontend after env updates so the site key is present at runtime.
7. Test both login and signup flows, including expired captcha retry.

If captcha is enabled in Supabase but the site key is missing or wrong in frontend, auth can fail with token endpoint errors (including 500 responses).

## Features

- 🎯 Real-time trading signals
- 📊 Market intelligence dashboard
- 🔐 Secure authentication via Supabase
- 🎨 Responsive design with Tailwind CSS
- ⚡ Fast performance with Vite

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is proprietary and confidential.
