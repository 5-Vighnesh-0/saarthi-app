import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.saarthi.app",
  appName: "Saarthi",
  webDir: "out",
  server: {
    // During dev: point to your machine's local API
    // Change to production URL before release
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true, // allow http API calls during development
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
