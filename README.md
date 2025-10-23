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

The dev server will start at `http://localhost:5173` by default.

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

Create a `.env.local` file in the root directory:

```env
VITE_API_BASE_URL=https://api.example.com
```

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
