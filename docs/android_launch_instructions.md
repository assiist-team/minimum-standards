# Android Quick Launch

## One-Time Setup
Ensure Java 17 is your active JDK.

## Launch Sequence

1. **Start Emulator**
   ```bash
   $HOME/Library/Android/sdk/emulator/emulator -avd Medium_Phone_API_36
   ```

2. **Run App** (in a new terminal)
   ```bash
   export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
   export PATH="$JAVA_HOME/bin:$PATH"
   
   # Map Metro port
   $HOME/Library/Android/sdk/platform-tools/adb reverse tcp:8081 tcp:8081
   
   # Build & Install
   cd apps/mobile
   npx react-native run-android --no-packager
   ```

3. **Start Metro** (if not running)
   ```bash
   cd apps/mobile && npm start
   ```
