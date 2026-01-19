# MinimumStandardsMobile – Android Build & Launch

_Last updated: 2026-01-19_

This document captures the current Android build requirements, the dev loop, and the release build checklist for `apps/mobile`. It is intentionally explicit so a junior engineer can follow it without guesswork.

---

## Progress

_Date: 2026-01-18_

- [x] Verified Android config values in Gradle files (app ID, SDK targets, build tools, wrapper, Kotlin, Hermes, new arch).
- [x] Confirmed `react-native-vector-icons` and `react-native-config` wiring in `apps/mobile/android/app/build.gradle`.
- [x] Confirmed `google-services.json` is missing in `apps/mobile/android/app/`.
- [x] Confirmed Google Services / Crashlytics plugins are not wired in Gradle.
- [x] Ran Metro preflight (`./scripts/check-metro.sh`) — pass after:
  - Installing Watchman.
  - Adding repo to Watchman watch list.
  - Freeing port 8081.
- [x] Started Android dev build (`npm run android`) — initial attempt failed:
  - `adb` not found (Android platform-tools missing from PATH).
  - No Android emulator available (`emulator -list-avds` empty).
  - Java runtime not found for Gradle.
  - React Native CLI could not open a new terminal window for Metro (`--terminal` not set).
- [x] Installed Android platform-tools (`adb`) via Homebrew.
- [x] Installed JDK 17 via Homebrew (`openjdk@17`).
- [x] Confirmed Android SDK + emulator binaries exist under `~/Library/Android/sdk`.
- [x] Started emulator `Medium_Phone_API_36` and verified `adb devices`.
- [x] Started Metro manually (`npm start`) to avoid terminal launcher issues.
- [x] Updated Gradle wrapper to 8.7 to satisfy AGP minimum version.
- [x] Added manifest placeholder for `usesCleartextTraffic` (debug=true, release=false).
- [x] Aligned Kotlin to 1.9.24 and forced Kotlin dependency versions.
- [x] Pinned `react-native-gesture-handler` to 2.20.2 (RN 0.76 compatible).
- [x] Patched `react-native-safe-area-context` Kotlin `Dynamic.type` access (patch-package).
- [x] Updated `MainApplication.kt` to RN 0.76-compatible `ReactNativeHost` setup.
- [x] Built + installed Android app (`npx react-native run-android --no-packager`) successfully.
- [x] Current runtime state:
  - Emulator `Medium_Phone_API_36` running.
  - Metro bundler running on port 8081.
- [x] Added Google Services + Crashlytics Gradle classpaths in `apps/mobile/android/build.gradle`.
- [x] Applied Google Services + Crashlytics plugins in `apps/mobile/android/app/build.gradle`.
- [x] Added release signing scaffold in `apps/mobile/android/app/build.gradle` (uses `keystore.properties` when present).
- [x] Added `apps/mobile/android/app/google-services.json` for package `app.nine4.minimum_standards`.
- [x] Created `apps/mobile/android/keystore.properties` with local keystore path + passwords.
- [x] Added `apps/mobile/.env` — **exists locally** (ensure it contains required secrets).
- [x] Created release keystore at `~/.keystores/minimum-standards-release.keystore`.
- [x] Fixed Gradle settings plugin error (`com.facebook.react.settings`) by matching RN 0.76 template structure in `settings.gradle`.
- [x] Explicitly set AGP version to 8.2.1 and downgraded target SDK to 35 for stability.
- [x] Run `./gradlew clean assembleRelease` to verify fixes — **SUCCESS**.
- [x] Re-enabled Hermes in `apps/mobile/android/gradle.properties`.
- [x] Fixed `UnsatisfiedLinkError` (missing `libhermes_executor.so`) by initializing `SoLoader` with `OpenSourceMergedSoMapping` in `MainApplication.kt`.
- [x] Verified app launch on Emulator `Medium_Phone_API_36`.

_Date: 2026-01-19_

- [x] **Verification:** Verified Node (v20.19.6) and Java (OpenJDK 17 via Homebrew) environments.
- [x] **Verification:** Verified `ANDROID_HOME` and `adb` connectivity (`emulator-5554` connected).
- [x] **Fix:** Ran `watchman watch "/Users/benjaminmackenzie/Dev/minimum_standards"` to fix Metro preflight warning.
- [x] **Fix:** Resolved "Unable to load script" error on emulator by running `adb reverse tcp:8081 tcp:8081`. This maps the emulator's localhost port to the machine's Metro server.
- [x] **Verification:** Verified app launch and connectivity to Metro (reload successful).
- [x] **Issue Identified:** Runtime error `Unable to resolve module react-native-dictation` in `LogEntryModal.tsx`.
- [x] **Documentation Update:** Identified `react-native-dictation` as a local private package. It is **not** on NPM.

---

## 1. Current Android Configuration (Repo Findings)

- **App ID / namespace:** `app.nine4.minimum_standards` (`apps/mobile/android/app/build.gradle`)
- **SDK targets:** `minSdk 24`, `compileSdk 35`, `targetSdk 35`
- **Build tools:** `35.0.0`
- **Gradle wrapper:** `8.7` (`apps/mobile/android/gradle/wrapper/gradle-wrapper.properties`)
- **Kotlin:** `1.9.24`
- **Hermes:** `true` (`apps/mobile/android/gradle.properties`)
- **New Architecture:** `false` (`apps/mobile/android/gradle.properties`)
- **Vector icons:** fonts gradle applied (`react-native-vector-icons`)
- **react-native-config:** `.env` is used for both debug + release variants

### Runtime crash (RESOLVED)

Previously, the app crashed on launch with `UnsatisfiedLinkError: dlopen failed: library "libhermes_executor.so" not found`.
This was caused by React Native 0.76+ merging native libraries in a way that requires `SoLoader` to use a mapping.

**Fix:** Updated `MainApplication.kt` to initialize `SoLoader` with `OpenSourceMergedSoMapping`:
```kotlin
SoLoader.init(this, OpenSourceMergedSoMapping)
```

### Firebase / Google Services (Important)

This app depends on `@react-native-firebase/*` packages, but the Android project does **not** currently include:
- `google-services.json` under `apps/mobile/android/app/`
- `com.google.gms.google-services` plugin wiring in Gradle

That means Firebase will not initialize on Android until the Google Services config is added and the plugin is enabled. Treat this as a blocking setup requirement for real device builds.

### Local Dependency: `react-native-dictation`

The file `src/components/LogEntryModal.tsx` imports `react-native-dictation`.
- **Status:** This is a **local private package**. It does **not** exist on NPM.
- **Location:** The source code and documentation are located at `/Users/benjaminmackenzie/Dev/react_native_dictation/`.
- **Integration:** You must follow the instructions in the [README](/Users/benjaminmackenzie/Dev/react_native_dictation/README.md) located in that directory to correctly link and build this dependency.
- **Temporary State:** `LogEntryModal.tsx` may contain a mocked implementation or fail to resolve until this local package is properly linked in `package.json` or `metro.config.js`.

**Action Required:**
1.  Read `/Users/benjaminmackenzie/Dev/react_native_dictation/README.md`.
2.  Link the package locally (e.g., `npm install ../../react_native_dictation` or via `wml`/`watchman` if outside the monorepo root).
3.  Ensure native modules are linked (Autolinking should handle it if added to `package.json`).

---

## 2. Prerequisites (Exact)

1. **Android Studio** installed and opened at least once.
2. **JDK 17+** installed and set as the Gradle JDK in Android Studio.
3. **Android SDK 35 + Build Tools 35.0.0** installed.
4. **NDK 27.1.12297006** installed (Android Studio SDK Manager → SDK Tools).
5. **Node 20+** installed (matches repo engines).

### 2.1 Android Studio SDK Manager checklist

Android Studio → Settings → Android SDK

- **SDK Platforms**
  - Android 35 (API 35) installed
- **SDK Tools**
  - Android SDK Build-Tools 35.0.0
  - Android SDK Platform-Tools
  - Android SDK Command-line Tools (latest)
  - NDK (Side by side) 27.1.12297006

If any of these are missing, Gradle builds will fail.

### 2.2 JDK selection

In Android Studio: Settings → Build, Execution, Deployment → Build Tools → Gradle → **Gradle JDK** → select JDK 17+.


---

## 3. Monorepo Rule (Always Required)

If you change anything under `packages/*`, you must do both:

1. `npm run build` in each touched package
2. `npm install` inside `apps/mobile`

Metro and the Android bundler read from `apps/mobile/node_modules`, not workspace source files. If you skip this, you will bundle stale code.

---

## 4. Android Dev Build (Fast Refresh)

**Recommended daily loop**

1. **Preflight Metro** (optional but recommended)  
   ```bash
   ./scripts/check-metro.sh
   ```

2. **Start the app on emulator or device**  
   ```bash
   cd apps/mobile
   npm run android
   ```

This command runs Metro and `react-native run-android` concurrently.

### 4.1 First-time emulator setup (if no device)

Android Studio → Device Manager → Create Device:
- Pick a Pixel device (any modern one is fine)
- Use **API 35** system image
- Start the emulator before running `npm run android`

### 4.2 First-time physical device setup

- Enable Developer Options on the phone.
- Enable USB debugging.
- Connect via USB and accept the prompt on the device.
- Verify the device is visible:
  ```bash
  cd apps/mobile/android
  ./gradlew devices
  ```

### 4.3 Post-dev setup checklist (next phase)

These are required before QA or any real release build:

1. **Firebase Android config** — add `apps/mobile/android/app/google-services.json`.
2. **Env file** — add `apps/mobile/.env` (from secrets store).
3. **Release signing** — create keystore + `apps/mobile/android/keystore.properties`.
4. **Rebuild** — run `./gradlew clean` then rebuild after config changes.


---

## 5. Release Build (APK / AAB)

### 5.1 Assemble a release APK
```bash
cd apps/mobile/android
./gradlew assembleRelease
```

### 5.2 Build a Play Store bundle (AAB)
```bash
cd apps/mobile/android
./gradlew bundleRelease
```

### 5.3 Signing (Required for real releases)

The `release` build uses the **real keystore when `keystore.properties` exists**, otherwise it falls back to the debug keystore. This must be replaced with a real signing config before any Play Store upload.

#### 5.3.1 Create a release keystore (one-time)

```bash
keytool -genkeypair -v \
  -keystore minimum-standards-release.keystore \
  -alias minimum-standards \
  -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore outside the repo (example: `~/.keystores/minimum-standards-release.keystore`).

#### 5.3.2 Add signing properties (never commit secrets)

Create `apps/mobile/android/keystore.properties` (do not commit):
```
storeFile=/Users/your-user/.keystores/minimum-standards-release.keystore
storePassword=REPLACE_ME
keyAlias=minimum-standards
keyPassword=REPLACE_ME
```

#### 5.3.3 Wire signing config in Gradle (already done in repo)

Add this near the top of `apps/mobile/android/app/build.gradle`:
```
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Update `signingConfigs` + `buildTypes.release`:
```
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}

buildTypes {
    debug { signingConfig signingConfigs.debug }
    release {
        signingConfig signingConfigs.release
        minifyEnabled enableProguardInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

If the `keystore.properties` file is missing, release builds will still sign with the debug keystore. Replace it before any store upload.

---

## 6. Firebase Setup (Android) — Required

This app uses `@react-native-firebase/*`, which requires **Google Services** configuration.

### 6.1 Download config

1. In Firebase Console, create Android app with package name `app.nine4.minimum_standards`.
2. Download `google-services.json`.
3. Place it at: `apps/mobile/android/app/google-services.json`.

**Note:** a file with package `app.assiist.minimum_standards` will not work for this app. Re-download with the correct package name.

### 6.2 Wire the Gradle plugin (already done in repo)

In `apps/mobile/android/build.gradle`, add the classpath dependency:
```
buildscript {
  dependencies {
    classpath("com.google.gms:google-services:4.4.2")
    classpath("com.google.firebase:firebase-crashlytics-gradle:3.0.2")
  }
}
```

In `apps/mobile/android/app/build.gradle`, apply the plugins **at the bottom**:
```
apply plugin: "com.google.gms.google-services"
apply plugin: "com.google.firebase.crashlytics"
```

Without this, Firebase Auth, Firestore, Crashlytics, and Messaging will not initialize on Android. This wiring is now present; the remaining blocker is the missing `google-services.json`.

---

## 7. Environment Variables (`react-native-config`)

This project uses `react-native-config`, which reads `.env` at build time. The file is intentionally ignored.

### 7.1 Required Variables

Currently, the only required variable is:

```bash
# Google Sign-In (Required for Firebase Auth)
# Get this from Firebase Console > Authentication > Sign-in method > Google > Web client ID
GOOGLE_SIGN_IN_WEB_CLIENT_ID=your-web-client-id-here.apps.googleusercontent.com
```

### 7.2 Setup

1. Copy the env template: `cp apps/mobile/.env.example apps/mobile/.env`
2. Fill in the real `GOOGLE_SIGN_IN_WEB_CLIENT_ID` (from your secrets manager or Firebase Console).
3. Rebuild after changing `.env` — values are baked into the build.

If `.env` is missing, Android builds may still complete, but runtime behavior will be wrong.

---

## 8. Troubleshooting Hooks

- **"SDK location not found"** → Create `apps/mobile/android/local.properties` with content `sdk.dir=/Users/your-username/Library/Android/sdk`.
- **"Unsupported class file major version 69"** (or similar high number) → You are running with a bleeding-edge Java version (e.g., Java 25).
  - Fix: `export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"` (verify path with `brew --prefix openjdk@17`).
- **Metro won’t pick up monorepo changes** → rebuild packages + `npm install` inside `apps/mobile`
- **Gradle/SDK mismatch** → confirm SDK 35 and Build Tools 35.0.0 installed in Android Studio
- **Firebase initialization crash** → verify `google-services.json` and plugin wiring
- **Stale `.env` values** → clean + rebuild; `.env` is read at build time
- **"Unable to load script" (Red screen)** → The app cannot connect to the Metro bundler.
  - Fix 1: Ensure Metro is running (`npm start`).
  - Fix 2: Run `adb reverse tcp:8081 tcp:8081` to map the emulator's localhost port to your machine.
- **"Unable to resolve module react-native-dictation"** → The dependency is missing/private.
  - Fix: The package is located at `/Users/benjaminmackenzie/Dev/react_native_dictation`. Follow its `README.md` to link it.


---

## 9. Open Decisions / Gaps

- **Missing Dependency:** `react-native-dictation` is referenced but missing from `package.json`. It resides locally at `/Users/benjaminmackenzie/Dev/react_native_dictation`.
- Confirm whether `google-services.json` should be committed or injected via CI.
- Decide on release signing strategy (keystore location + CI secrets).
- Validate Android-specific `.env` keys required by `react-native-config`.

---

## 10. Quick Command Reference

```bash
# Dev
cd apps/mobile
npm run android

# Release APK
cd apps/mobile/android
./gradlew assembleRelease

# Release AAB
cd apps/mobile/android
./gradlew bundleRelease
```
