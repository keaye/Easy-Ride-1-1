require("dotenv").config(); // Load .env variables

module.exports = () => {
  return {
    expo: {
      name: "Easy-Ride",
      slug: "eazyride",
      owner: "ayoee",
      description:
        "A simple E-Hailing App, that helps users commute to different destinations",
      platforms: ["ios", "android", "web"],
      extra: {
        eas: {
          projectId: "24cc1307-a019-4b6c-b610-29141d1c9ac6",
        },
      },
      scheme: "easyride",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      experimental: {
        enableNewArchitecture: false, // Ensure new architecture is disabled for iOS
      },
      "expo-splash-screen": {
        backgroundColor: "#232323",
        image: "./assets/splash-icon.png",
        dark: {
          image: "./assets/splash-icon-dark.png",
          backgroundColor: "#000000",
        },
        imageWidth: 200,
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: "com.keaye.Easy-Ride",
        experimental: {
          enableNewArchitecture: false, // Ensure new architecture is disabled for iOS
        },
        config: {
          googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "default-key",
        },
        googleServicesFile: "./GoogleService-Info.plist",
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff",
        },
        experimental: {
          enableNewArchitecture: false, // Ensure new architecture is disabled for Android
        },
        package: "com.ayo.Easy_Ride",
        config: {
          googleMaps: {
            apiKey: process.env.GOOGLE_MAPS_API_KEY || "default-key",
          },
        },
        googleServicesFile: "./google-services.json",
      },
      web: {
        favicon: "./assets/favicon.png",
      },
      runtimeVersion: {
        policy: "appVersion",
      },
      updates: {
        url: "https://u.expo.dev/45b68cbb-889e-4e76-bc96-f3c4a3c5d9d2",
      },
    },
  };
};
