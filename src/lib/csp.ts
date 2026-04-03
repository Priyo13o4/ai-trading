const unique = (values: Array<string | null | undefined>): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }

  return out;
};

const toConnectSource = (url: string): string | null => {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

const isLocalEnv = (envName: string): boolean => {
  const normalized = envName.trim().toLowerCase();
  return normalized === '' || normalized === 'local' || normalized === 'development';
};

interface BuildCspPolicyOptions {
  apiBaseUrl: string;
  sseBaseUrl: string;
  envName: string;
  includeRequireTrustedTypes?: boolean;
  allowUnsafeInlineScript?: boolean;
}

export const buildCspPolicy = ({
  apiBaseUrl,
  sseBaseUrl,
  envName,
  includeRequireTrustedTypes = false,
  allowUnsafeInlineScript = false,
}: BuildCspPolicyOptions): string => {
  const connectSources = unique([
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    ...(isLocalEnv(envName) ? ['http://localhost:*', 'ws://localhost:*'] : []),
    'https://challenges.cloudflare.com',
    'https://static.cloudflareinsights.com',
    'https://api.nowpayments.io',
    'https://api.razorpay.com',
    'https://cdn.razorpay.com',
    'https://checkout-static-next.razorpay.com',
    'https://lumberjack.razorpay.com',
    'https://lumberjack-cx.rzp.io',
    toConnectSource(apiBaseUrl),
    toConnectSource(sseBaseUrl),
  ]);

  const scriptSources = [
    "'self'",
    ...(allowUnsafeInlineScript ? ["'unsafe-inline'"] : []),
    'https://challenges.cloudflare.com',
    'https://static.cloudflareinsights.com',
    'https://checkout.razorpay.com',
    'https://cdn.razorpay.com',
    'https://checkout-static-next.razorpay.com',
  ].join(' ');

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    `connect-src ${connectSources.join(' ')}`,
    "frame-src https://challenges.cloudflare.com https://checkout.razorpay.com https://api.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "trusted-types default dompurify",
  ];

  if (includeRequireTrustedTypes) {
    directives.push("require-trusted-types-for 'script'");
  }

  return directives.join('; ');
};
