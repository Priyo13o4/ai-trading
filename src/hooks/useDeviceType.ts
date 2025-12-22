/**
 * Platform Detection Hook
 * Detects device type: desktop, mobile-web, or mobile-app
 * Cached in sessionStorage for performance
 */

import { useState, useEffect } from 'react';

export type DeviceType = 'desktop' | 'mobile-web' | 'mobile-app';

interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isNativeApp: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
}

const CACHE_KEY = 'pipfactor_device_type';

/**
 * Detect if running inside a native mobile app
 * Checks for:
 * 1. Custom user agent flag
 * 2. React Native WebView
 * 3. Expo app environment
 * 4. Deep link origin
 */
const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Check for React Native WebView
  const ua = navigator.userAgent;
  if (ua.includes('PipFactor-App') || ua.includes('ReactNative')) {
    return true;
  }

  // Check for Expo
  // @ts-ignore - Expo sets this global
  if (window.expo !== undefined) {
    return true;
  }

  // Check if opened via deep link (only in app)
  const isDeepLink = window.location.protocol === 'pipfactor:';
  if (isDeepLink) {
    return true;
  }

  // Check for custom window property set by native app
  // @ts-ignore - Custom property set by app
  if (window.isNativeApp === true) {
    return true;
  }

  return false;
};

/**
 * Detect if device is mobile based on screen size and user agent
 */
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Check user agent
  const isMobileUA = mobileRegex.test(ua);
  
  // Check screen size (mobile typically < 768px)
  const isMobileScreen = window.innerWidth < 768;
  
  // Check touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Mobile if either UA matches OR (small screen + touch)
  return isMobileUA || (isMobileScreen && hasTouch);
};

/**
 * Detect if device is a tablet
 */
const isTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent;
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;
  
  // Check user agent
  const isTabletUA = tabletRegex.test(ua);
  
  // Check screen size (tablet typically 768px - 1024px)
  const width = window.innerWidth;
  const isTabletScreen = width >= 768 && width <= 1024;
  
  return isTabletUA || isTabletScreen;
};

/**
 * Determine device type with caching
 */
const detectDeviceType = (): DeviceType => {
  // Check for test override (for development)
  const urlParams = new URLSearchParams(window.location.search);
  const testPlatform = urlParams.get('platform') as DeviceType | null;
  if (testPlatform && ['desktop', 'mobile-web', 'mobile-app'].includes(testPlatform)) {
    console.log(`[DeviceType] Test mode: ${testPlatform}`);
    return testPlatform;
  }

  // Check if native app
  if (isNativeApp()) {
    return 'mobile-app';
  }

  // Check if mobile web
  if (isMobileDevice() || isTabletDevice()) {
    return 'mobile-web';
  }

  // Default to desktop
  return 'desktop';
};

/**
 * Hook to get current device type
 * Caches result in sessionStorage for performance
 */
export const useDeviceType = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Try to get cached value
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          // Validate cache is still accurate (screen size might change)
          const currentType = detectDeviceType();
          if (parsed.type === currentType) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('[DeviceType] Cache read error:', e);
      }
    }

    // No cache, detect now
    const type = detectDeviceType();
    const info: DeviceInfo = {
      type,
      isMobile: type === 'mobile-web' || type === 'mobile-app',
      isTablet: isTabletDevice(),
      isDesktop: type === 'desktop',
      isNativeApp: type === 'mobile-app',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
      screenHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    };

    // Cache it
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(info));
      } catch (e) {
        console.error('[DeviceType] Cache write error:', e);
      }
    }

    return info;
  });

  // Re-detect on window resize (debounced)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const newType = detectDeviceType();
        if (newType !== deviceInfo.type) {
          const newInfo: DeviceInfo = {
            type: newType,
            isMobile: newType === 'mobile-web' || newType === 'mobile-app',
            isTablet: isTabletDevice(),
            isDesktop: newType === 'desktop',
            isNativeApp: newType === 'mobile-app',
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
          };
          setDeviceInfo(newInfo);
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(newInfo));
        }
      }, 300);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [deviceInfo.type]);

  // Listen for orientation change on mobile
  useEffect(() => {
    if (deviceInfo.isMobile) {
      const handleOrientationChange = () => {
        // Re-detect after orientation change
        setTimeout(() => {
          const newType = detectDeviceType();
          const newInfo: DeviceInfo = {
            type: newType,
            isMobile: newType === 'mobile-web' || newType === 'mobile-app',
            isTablet: isTabletDevice(),
            isDesktop: newType === 'desktop',
            isNativeApp: newType === 'mobile-app',
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
          };
          setDeviceInfo(newInfo);
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(newInfo));
        }, 300);
      };

      window.addEventListener('orientationchange', handleOrientationChange);
      return () => window.removeEventListener('orientationchange', handleOrientationChange);
    }
  }, [deviceInfo.isMobile]);

  return deviceInfo;
};

/**
 * Utility to clear device type cache
 * Useful for testing or when user explicitly changes platform
 */
export const clearDeviceTypeCache = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(CACHE_KEY);
  }
};
