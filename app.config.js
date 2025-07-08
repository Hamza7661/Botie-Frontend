export default {
  expo: {
    name: "Botie",
    slug: "botie-frontend",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    assetBundlePatterns: ["**/*"],
    ios: {
      bundleIdentifier: "com.botie.app",
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app uses location to provide location-based reminders and track your position for relevant notifications.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "This app uses location in the background to provide location-based reminders even when the app is not active.",
        NSLocationAlwaysUsageDescription: "This app uses location in the background to provide location-based reminders even when the app is not active.",
        UIBackgroundModes: ["location", "background-fetch"],
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#007bff"
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "WAKE_LOCK"
      ],
      foregroundServiceType: ["location"]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow Botie to use your location for location-based reminders.",
          locationAlwaysPermission: "Allow Botie to use your location in the background for location-based reminders.",
          locationWhenInUsePermission: "Allow Botie to use your location for location-based reminders."
        }
      ]
    ],
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000/api",
      googleApiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
      eas: {
        projectId: "7c61d599-6b25-4c85-916a-fdf9c2c311a8"
      }
    }
  }
}; 