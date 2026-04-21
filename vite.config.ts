import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { buildCspPolicy } from "./src/lib/csp";

import prerenender from '@prerenderer/rollup-plugin';

const LOCAL_DEFAULT_API_URL = "http://localhost:8080";
const LOCAL_DEFAULT_SSE_URL = "http://localhost:8081";

const sanitizeUrl = (value: string | undefined, fallback: string): string => {
  const candidate = (value || "").trim().replace(/\/+$/, "");
  return candidate || fallback;
};

const toHostname = (url: string): string | null => {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

const parseAllowedHosts = (
  value: string | undefined,
  envName: string,
  publicAppUrl: string,
  publicSiteUrl: string,
): true | string[] => {
  if (!value || !value.trim()) {
    const normalizedEnv = (envName || '').trim().toLowerCase();

    // Local development should not require production domain hostnames.
    if (normalizedEnv === 'local' || normalizedEnv === 'development') {
      return true;
    }

    const derivedHosts = [
      toHostname(publicAppUrl),
      toHostname(publicSiteUrl),
    ].filter((host, index, source): host is string => Boolean(host) && source.indexOf(host) === index);

    return derivedHosts.length > 0 ? derivedHosts : true;
  }

  const hosts = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return hosts.length > 0 ? hosts : true;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const envName = (env.VITE_ENV_NAME || mode || '').trim().toLowerCase();
  const isLocalEnv = envName === '' || envName === 'local' || envName === 'development';
  const apiBaseUrl = sanitizeUrl(env.VITE_API_BASE_URL, isLocalEnv ? LOCAL_DEFAULT_API_URL : '');
  const sseBaseUrl = sanitizeUrl(env.VITE_API_SSE_URL, isLocalEnv ? LOCAL_DEFAULT_SSE_URL : '');

  if (!isLocalEnv && !apiBaseUrl) {
    throw new Error(
      '[vite.config] VITE_API_BASE_URL is required when VITE_ENV_NAME is not local/development.'
    );
  }

  if (!isLocalEnv && !sseBaseUrl) {
    throw new Error(
      '[vite.config] VITE_API_SSE_URL is required when VITE_ENV_NAME is not local/development.'
    );
  }

  const publicAppUrl = sanitizeUrl(env.VITE_PUBLIC_APP_URL, '');
  const publicSiteUrl = sanitizeUrl(env.VITE_PUBLIC_SITE_URL, '');
  const devServerCsp = buildCspPolicy({
    apiBaseUrl,
    sseBaseUrl,
    envName,
    allowUnsafeInlineScript: true,
  });
  const previewCsp = buildCspPolicy({ apiBaseUrl, sseBaseUrl, envName });
  const ttCspEnforce = buildCspPolicy({
    apiBaseUrl,
    sseBaseUrl,
    envName,
    includeRequireTrustedTypes: true,
  });
  const devHeaders: Record<string, string> = {
    "Content-Security-Policy": devServerCsp,
  };
  const previewHeaders: Record<string, string> = {
    "Content-Security-Policy": previewCsp,
  };

  if (env.VITE_TT_REPORT_ONLY === "1") {
    devHeaders["Content-Security-Policy-Report-Only"] = ttCspEnforce;
  }

  return {
    server: {
      host: true,
      port: 3000,
      allowedHosts: parseAllowedHosts(env.VITE_ALLOWED_HOSTS, envName, publicAppUrl, publicSiteUrl),
      headers: devHeaders,
    },
    preview: {
      host: true,
      port: 3000,
      strictPort: true,
      headers: previewHeaders,
    },
    plugins: [
      react(),
      prerenender({
        routes: ['/', '/pricing'],
        renderer: '@prerenderer/renderer-puppeteer',
        rendererOptions: {
          maxConcurrentRoutes: 1,
          renderAfterTime: 3000, // Waits 3s for react-helmet-async and DOM to settle
          headless: true, // Use old headless for broader compatibility
        },
        postProcess(renderedRoute) {
          // Normalize HTML string slightly if needed
          renderedRoute.html = renderedRoute.html.trim();
        }
      }),
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
  };
});
