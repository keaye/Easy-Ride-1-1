// firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// Replace with your own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD3SUnAEHmTBXoGqp86pEvNIPE72cm-mO4",
  authDomain: "keaye-faaed.firebaseapp.com",
  projectId: "keaye-faaed",
  storageBucket: "keaye-faaed.firebasestorage.app",
  messagingSenderId: "894165136627",
  appId: "1:894165136627:web:a4759522b96e76f82e7386",
  measurementId: "G-T6LBF1X8RD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Check if Analytics is supported before initializing
let analytics;
isSupported()
  .then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics initialized.");
    } else {
      console.warn("Firebase Analytics is not supported in this environment.");
    }
  })
  .catch((error) => {
    console.error("Error checking Analytics support:", error);
  });

  // Only try to initialize analytics in production
if (process.env.NODE_ENV === 'production') {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics initialized.");
      }
    })
    .catch((error) => {
      console.error("Error checking Analytics support:", error);
    });
} else {
  console.log("Analytics initialization skipped in development mode");
}

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Initialize Firestore
const db = getFirestore(app);

// Example of how to prepare a location document for Firestore
const prepareLocationForFirestore = (location) => {
  // Create an array of search terms from the name and description
  const words = [
    ...location.name.toLowerCase().split(" "),
    ...location.description.toLowerCase().split(" "),
  ];

  // Remove duplicates and common words if needed
  const searchTerms = [...new Set(words)].filter(
    (word) => word.length > 2 && !["the", "and", "for"].includes(word)
  );

  return {
    ...location,
    searchTerms,
  };
};

export { auth, db, prepareLocationForFirestore };
