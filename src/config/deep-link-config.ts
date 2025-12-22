/**
 * Deep Link Configuration
 * Handles URL schemes for mobile app deep linking
 * 
 * Supported URL patterns:
 * - pipfactor://auth/callback?token=xxx&type=signup
 * - pipfactor://auth/verify?token=xxx
 * - pipfactor://auth/confirm?token=xxx
 * - pipfactor://auth/recovery?token=xxx
 * 
 * Also supports universal links (HTTPS):
 * - https://pipfactor.com/auth/callback?token=xxx
 */

export const DEEP_LINK_CONFIG = {
  // App URL scheme
  scheme: 'pipfactor',
  
  // Hosts (for universal links)
  hosts: {
    production: 'pipfactor.com',
    development: 'localhost:3000',
  },
  
  // Paths that can be deep linked
  paths: {
    authCallback: '/auth/callback',
    authVerify: '/auth/verify',
    authConfirm: '/auth/confirm',
    authRecovery: '/auth/recovery',
  },
  
  // Expo app.json configuration (for reference)
  expoConfig: {
    scheme: 'pipfactor',
    platforms: ['ios', 'android'],
  },
};

/**
 * Build deep link URL for mobile app
 */
export const buildDeepLink = (
  path: keyof typeof DEEP_LINK_CONFIG.paths,
  params?: Record<string, string>
): string => {
  const pathValue = DEEP_LINK_CONFIG.paths[path];
  const paramString = params 
    ? '?' + new URLSearchParams(params).toString()
    : '';
  
  return `${DEEP_LINK_CONFIG.scheme}:/${pathValue}${paramString}`;
};

/**
 * Build universal link (HTTPS) - fallback if app not installed
 */
export const buildUniversalLink = (
  path: keyof typeof DEEP_LINK_CONFIG.paths,
  params?: Record<string, string>,
  env: 'production' | 'development' = 'production'
): string => {
  const host = DEEP_LINK_CONFIG.hosts[env];
  const pathValue = DEEP_LINK_CONFIG.paths[path];
  const paramString = params 
    ? '?' + new URLSearchParams(params).toString()
    : '';
  
  return `https://${host}${pathValue}${paramString}`;
};

/**
 * Parse deep link URL and extract components
 */
export const parseDeepLink = (url: string): {
  isDeepLink: boolean;
  path: string | null;
  params: Record<string, string>;
} => {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a deep link (custom scheme)
    const isDeepLink = urlObj.protocol === `${DEEP_LINK_CONFIG.scheme}:`;
    
    // Extract path (remove leading slashes)
    const path = urlObj.pathname.replace(/^\/+/, '');
    
    // Extract params
    const params: Record<string, string> = {};
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return {
      isDeepLink,
      path: path || null,
      params,
    };
  } catch (error) {
    console.error('[DeepLink] Failed to parse URL:', error);
    return {
      isDeepLink: false,
      path: null,
      params: {},
    };
  }
};

/**
 * Check if current URL is a deep link
 */
export const isDeepLinkUrl = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === `${DEEP_LINK_CONFIG.scheme}:`;
};

/**
 * Expo app.json configuration snippet
 * Add this to your app.json for Expo projects
 */
export const EXPO_CONFIG_SNIPPET = {
  expo: {
    scheme: DEEP_LINK_CONFIG.scheme,
    // iOS
    ios: {
      bundleIdentifier: 'com.pipfactor.app',
      associatedDomains: [
        `applinks:${DEEP_LINK_CONFIG.hosts.production}`,
      ],
    },
    // Android
    android: {
      package: 'com.pipfactor.app',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: DEEP_LINK_CONFIG.hosts.production,
              pathPrefix: '/auth',
            },
            {
              scheme: DEEP_LINK_CONFIG.scheme,
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
  },
};

/**
 * iOS Info.plist configuration snippet
 * Add this to your Info.plist for native iOS apps
 */
export const IOS_PLIST_SNIPPET = `
<!-- URL Types for Deep Linking -->
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>${DEEP_LINK_CONFIG.scheme}</string>
    </array>
    <key>CFBundleURLName</key>
    <string>com.pipfactor.app</string>
  </dict>
</array>

<!-- Universal Links -->
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:${DEEP_LINK_CONFIG.hosts.production}</string>
</array>
`;

/**
 * Android AndroidManifest.xml configuration snippet
 * Add this to your AndroidManifest.xml for native Android apps
 */
export const ANDROID_MANIFEST_SNIPPET = `
<!-- Deep Link Intent Filter -->
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  
  <!-- Custom Scheme -->
  <data android:scheme="${DEEP_LINK_CONFIG.scheme}" />
  
  <!-- Universal Links (HTTPS) -->
  <data
    android:scheme="https"
    android:host="${DEEP_LINK_CONFIG.hosts.production}"
    android:pathPrefix="/auth" />
</intent-filter>
`;

/**
 * Test deep link locally (for development)
 * 
 * iOS:
 * xcrun simctl openurl booted "pipfactor://auth/callback?token=test123&type=signup"
 * 
 * Android:
 * adb shell am start -W -a android.intent.action.VIEW -d "pipfactor://auth/callback?token=test123&type=signup" com.pipfactor.app
 */
export const testDeepLink = (token: string = 'test_token_123') => {
  const deepLink = buildDeepLink('authCallback', { token, type: 'signup' });
  console.log('\n=== Deep Link Test ===');
  console.log('Deep Link:', deepLink);
  console.log('\nTest on iOS Simulator:');
  console.log(`xcrun simctl openurl booted "${deepLink}"`);
  console.log('\nTest on Android Emulator:');
  console.log(`adb shell am start -W -a android.intent.action.VIEW -d "${deepLink}" com.pipfactor.app`);
  console.log('=====================\n');
};
