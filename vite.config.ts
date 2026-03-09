import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const TT_CSP_BASE = "default-src 'self'; script-src 'self' https://challenges.cloudflare.com https://static.cloudflareinsights.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.pipfactor.com http://localhost:* ws://localhost:* https://challenges.cloudflare.com https://static.cloudflareinsights.com; frame-src https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; object-src 'none'; base-uri 'self'; form-action 'self'; trusted-types default dompurify";
const TT_CSP_ENFORCE = `${TT_CSP_BASE}; require-trusted-types-for 'script'`;

const devHeaders: Record<string, string> = {};

if (process.env.VITE_TT_REPORT_ONLY === "1") {
  devHeaders["Content-Security-Policy-Report-Only"] = TT_CSP_ENFORCE;
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 3000,
    allowedHosts: ["pipfactor.com", "www.pipfactor.com"],
    headers: devHeaders,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-query"],
  },
});
