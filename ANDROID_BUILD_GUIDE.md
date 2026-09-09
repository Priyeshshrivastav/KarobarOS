# KarobarOS — Android App Build & Packaging Guide

KarobarOS is built with an **Android-First architecture** using **Capacitor 6** and Next.js. You can run and build it as a native Android APK or install it as a Progressive Web App (PWA).

---

## Architecture Overview

- **App ID:** `com.karobaros.app`
- **App Name:** `KarobarOS`
- **Native Wrapper:** Capacitor Android (`@capacitor/android`, `@capacitor/core`)
- **Native Mobile Features:**
  - Android-native bottom navigation bar
  - Safe-area insets (`viewport-fit=cover`)
  - Web Speech API integration for Hindi/English voice input
  - Offline-ready Web App Manifest (`manifest.webmanifest`)
  - Android splash & status bar theme `#059669` (Emerald)

---

## Method 1: Building Native Android APK with Capacitor

### Step 1: Prerequisites
1. **Android Studio** (Koala or newer) installed with Android SDK (API 34/33).
2. **JDK 17 or JDK 21** installed and configured in `JAVA_HOME`.
3. Node.js v18+.

### Step 2: Initialize Android Platform
From the project root directory:

```bash
# 1. Build the Next.js production bundle
npm run build

# 2. Add Android native platform (first time only)
npx cap add android

# 3. Sync web assets and plugins to the Android project
npx cap sync
```

### Step 3: Configure Dev vs Production Mode
Open `capacitor.config.ts`:

- **For Live Local Development on Android Emulator:**
  ```ts
  server: {
    url: 'http://10.0.2.2:3000', // Points to localhost on your host machine from Android Emulator
    cleartext: true,
  }
  ```
- **For Production APK:**
  ```ts
  server: {
    url: 'https://your-production-domain.vercel.app',
    cleartext: false,
  }
  ```

### Step 4: Build the APK

#### Option A: Using Android Studio (GUI)
```bash
npx cap open android
```
1. Wait for Gradle sync to finish.
2. In the top menu, click **Build** &rarr; **Build Bundle(s) / APK(s)** &rarr; **Build APK(s)**.
3. Once completed, click **Locate** to find your `app-debug.apk`.
4. Transfer `app-debug.apk` to any Android smartphone to install!

#### Option B: Using Gradle Command Line
If you have Android SDK and Gradle in your PATH:
```bash
cd android
./gradlew assembleDebug
```
The compiled APK will be located at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Method 2: Instant PWA Android Installation (No Android Studio Needed)

KarobarOS includes `public/manifest.webmanifest`. Any Android phone user can install it directly:

1. Deploy KarobarOS to Vercel (or visit on your mobile browser).
2. Open Chrome on Android and navigate to the website.
3. Tap the **"Add KarobarOS to Home Screen"** or **"Install App"** banner.
4. KarobarOS installs as a standalone native app icon on the Android launcher with full-screen experience and zero browser address bar!

---

## Voice Input Permissions on Android
When running inside Android WebView or Chrome, KarobarOS requests standard `RECORD_AUDIO` permission when the owner taps the microphone button. Granting permission enables Hindi and English voice speech recognition.
