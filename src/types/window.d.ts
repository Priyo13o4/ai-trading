/**
 * Global type extensions for TypeScript
 */

declare global {
  interface Window {
    // React Native WebView
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
    
    // Custom properties set by native app
    isNativeApp?: boolean;
    
    // Expo globals
    expo?: any;
  }
}

export {};
