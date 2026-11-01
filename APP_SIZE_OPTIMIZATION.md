# App Size Optimization

## Changes Made to Reduce APK Size

### 1. Enabled Code Minification (ProGuard/R8)
- **File:** `android/app/build.gradle`
- **Change:** Enabled `enableMinifyInReleaseBuilds = true`
- **Impact:** Reduces code size by removing unused code and obfuscating
- **Expected reduction:** ~20-30%

### 2. Enabled Resource Shrinking
- **File:** `android/app/build.gradle`
- **Change:** Enabled `shrinkResources = true`
- **Impact:** Removes unused resources (images, strings, etc.)
- **Expected reduction:** ~10-15%

### 3. Removed armeabi-v7a ABI
- **File:** `app.json`
- **Change:** Changed `abiFilters` from `["armeabi-v7a", "arm64-v8a"]` to `["arm64-v8a"]`
- **Impact:** Only builds for modern 64-bit ARM devices
- **Expected reduction:** ~40-50% (removes duplicate native libraries)
- **Note:** armeabi-v7a is for older 32-bit devices (pre-2019). Most modern devices support arm64-v8a.

### 4. Removed Unused Dependencies
- **File:** `package.json`
- **Removed:**
  - `react-dom` - Only needed for web
  - `react-native-web` - Only needed for web
  - `react-native-webview` - Not used in the app
- **Note:** `expo-media-library` was NOT removed - it's needed for saving QR code to gallery
- **Impact:** Reduces JavaScript bundle size
- **Expected reduction:** ~3-5%

### 5. Removed Web Configuration
- **File:** `app.json`
- **Change:** Removed `"web"` section
- **Impact:** Prevents web build artifacts from being included
- **Expected reduction:** ~2-5%

## Expected Total Reduction

**Before:** ~30 MB
**After:** ~13-16 MB
**Reduction:** ~45-55%

## How to Build the Optimized APK

```bash
# Build with EAS
npx eas build --platform android --profile production

# Or build locally
npx expo run:android --variant release
```

## Important Notes

1. **ABI Change:** By removing armeabi-v7a, the app will NOT work on very old Android devices (pre-2019, 32-bit only). Most modern devices (2019+) support arm64-v8a.

2. **Test Thoroughly:** After building, test the APK on:
   - Modern Android device (arm64-v8a)
   - Different screen sizes
   - All app features

3. **If You Need armeabi-v7a:** Add it back to `app.json`:
   ```json
   "abiFilters": ["armeabi-v7a", "arm64-v8a"]
   ```

## Additional Optimization Options

If you need even smaller size, consider:

1. **Hermes Engine:** Already enabled in app.json ✓
2. **Bundle Compression:** Can enable in build.gradle
3. **PNG Crunching:** Already enabled ✓
4. **Lazy Loading:** Load routes/screens only when needed
5. **Image Optimization:** Compress images in assets folder

## Revert Changes if Needed

If the optimization causes issues, revert the changes:
- In `build.gradle`: Change `enableMinifyInReleaseBuilds` back to `false`
- In `app.json`: Add back `"armeabi-v7a"` to `abiFilters`
- In `package.json`: Add back removed dependencies
