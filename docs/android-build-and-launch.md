# MinimumStandardsMobile – Android Build & Launch

_Last updated: 2026-01-17_

This document captures the current Android build requirements, the dev loop, and the release build checklist for `apps/mobile`. It is intentionally explicit so a junior engineer can follow it without guesswork.

---

## 1. Current Android Configuration (Repo Findings)

- **App ID / namespace:** `com.minimumstandardsmobile` (`apps/mobile/android/app/build.gradle`)
- **SDK targets:** `minSdk 24`, `compileSdk 36`, `targetSdk 36`
- **Build tools:** `36.0.0`
- **Gradle wrapper:** `9.0.0` (`apps/mobile/android/gradle/wrapper/gradle-wrapper.properties`)
- **Kotlin:** `2.1.20`
- **Hermes:** `true` (`apps/mobile/android/gradle.properties`)
- **New Architecture:** `false` (`apps/mobile/android/gradle.properties`)
- **Vector icons:** fonts gradle applied (`react-native-vector-icons`)
- **react-native-config:** `.env` is used for both debug + release variants

### Firebase / Google Services (Important)

This app depends on `@react-native-firebase/*` packages, but the Android project does **not** currently include:
- `google-services.json` under `apps/mobile/android/app/`
- `com.google.gms.google-services` plugin wiring in Gradle

That means Firebase will not initialize on Android until the Google Services config is added and the plugin is enabled. Treat this as a blocking setup requirement for real device builds.

---

## 2. Prerequisites (Exact)

1. **Android Studio** installed and opened at least once.
2. **JDK 17+** installed and set as the Gradle JDK in Android Studio.
3. **Android SDK 36 + Build Tools 36.0.0** installed.
4. **NDK 27.1.12297006** installed (Android Studio SDK Manager → SDK Tools).
5. **Node 20+** installed (matches repo engines).

### 2.1 Android Studio SDK Manager checklist

Android Studio → Settings → Android SDK

- **SDK Platforms**
  - Android 36 (API 36) installed
- **SDK Tools**
  - Android SDK Build-Tools 36.0.0
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
- Use **API 36** system image
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

The `release` build currently uses the **debug keystore**. This must be replaced with a real signing config before any Play Store upload.

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

#### 5.3.3 Wire signing config in Gradle

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

If the `keystore.properties` file is missing, release builds will fail — that is intentional.

---

## 6. Firebase Setup (Android) — Required

This app uses `@react-native-firebase/*`, which requires **Google Services** configuration.

### 6.1 Download config

1. In Firebase Console, create Android app with package name `com.minimumstandardsmobile`.
2. Download `google-services.json`.
3. Place it at: `apps/mobile/android/app/google-services.json`.

### 6.2 Wire the Gradle plugin

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

Without this, Firebase Auth, Firestore, Crashlytics, and Messaging will not initialize on Android.

---

## 7. Environment Variables (`react-native-config`)

This project uses `react-native-config`, which reads `.env` at build time. The file is intentionally ignored.

Required steps:
1. Copy the env template from your secrets store (or ask for it).
2. Place it at `apps/mobile/.env`.
3. Rebuild after changing `.env` — values are baked into the build.

If `.env` is missing, Android builds may still complete, but runtime behavior will be wrong.

---

## 8. Troubleshooting Hooks

- **Metro won’t pick up monorepo changes** → rebuild packages + `npm install` inside `apps/mobile`
- **Gradle/SDK mismatch** → confirm SDK 36 and Build Tools 36.0.0 installed in Android Studio
- **Firebase initialization crash** → verify `google-services.json` and plugin wiring
- **Stale `.env` values** → clean + rebuild; `.env` is read at build time

---

## 9. Open Decisions / Gaps

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
