import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.karobaros.app',
  appName: 'KarobarOS',
  webDir: 'public',
  server: {
    // When running locally in an emulator or on device, point to the dev machine or deployed URL
    // For local Android Emulator: http://10.0.2.2:3000
    // For live production: https://karobaros.vercel.app
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  }
};

export default config;
