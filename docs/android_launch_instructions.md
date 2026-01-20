# Android Quick Launch

## One-Time Setup
Ensure Java 17 is your active JDK.

Also make sure the SDK `adb` is first in your `PATH` (Homebrew `adb` can cause
launch failures like “Activity class does not exist”):

```bash
export ANDROID_SDK="$HOME/Library/Android/sdk"
export PATH="$ANDROID_SDK/platform-tools:$PATH"
```

## Launch Sequence

1. **Start Emulator** (wipe if needed)
   ```bash
   $ANDROID_SDK/emulator/emulator -avd Medium_Phone_API_36 -wipe-data
   ```

2. **Boot & unlock once**
   ```bash
   $ANDROID_SDK/platform-tools/adb wait-for-device
   $ANDROID_SDK/platform-tools/adb shell input keyevent 224
   $ANDROID_SDK/platform-tools/adb shell input keyevent 82
   ```

3. **Run App** (in a new terminal)
   ```bash
   export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
   export PATH="$JAVA_HOME/bin:$PATH"

   # Map Metro port
   $ANDROID_SDK/platform-tools/adb reverse tcp:8081 tcp:8081

   # Build & Install
   cd apps/mobile
   npx react-native run-android --no-packager
   ```

4. **Start Metro** (if not running)
   ```bash
   cd apps/mobile && npm start
   ```
