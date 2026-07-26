# Add project specific ProGuard rules here.
# By default, the flags in this directory are appended to flags specified
# in the Android SDK.

# Keep React Native bridge classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.soloader.** { *; }

# Keep @react-native-firebase modules (RNFirebase)
-keep class io.invertase.firebase.** { *; }
-dontwarn io.invertase.firebase.**

# Keep Firebase / Firestore Protobuf generated code
-keep class com.google.firebase.** { *; }
-keep class com.google.firestore.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.firestore.**
-dontwarn okhttp3.**
-dontwarn okio.**

# Keep Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Keep Expo modules
-keep class expo.modules.** { *; }
-dontwarn expo.modules.**
