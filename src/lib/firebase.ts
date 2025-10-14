// Import required Firebase functions
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyDWjTYxXAXkvG7F-zrhrI6JFDGCeUql0D8",
  authDomain: "it-knecht.firebaseapp.com",
  projectId: "it-knecht",
  storageBucket: "it-knecht.firebasestorage.app",
  messagingSenderId: "26567510400",
  appId: "1:26567510400:web:bdd398c4f59df9e91ad965"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore with persistence enabled
export const db = getFirestore(app);

// FIXED: Helper function returns pure ISO timestamp without timezone hacks
// This ensures consistent timestamp handling across the entire application
// Previously used +2 hours hack which caused data inconsistencies
export const getAdjustedTimestamp = () => {
  return new Date().toISOString();
};

// Export the Firebase instance for use in other files
export default app;

// Initialize Firebase Cloud Messaging (only in browser and not in WebContainer)
let messaging: any = null;

const isWebContainer = typeof window !== 'undefined' && window.location.hostname.includes('webcontainer');

if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !isWebContainer) {
  try {
    messaging = getMessaging(app);
    console.log('Firebase Cloud Messaging initialized');
  } catch (error) {
    console.error('Failed to initialize Firebase Cloud Messaging:', error);
  }
} else if (isWebContainer) {
  console.log('Running in WebContainer - FCM initialization skipped');
}

export { messaging };