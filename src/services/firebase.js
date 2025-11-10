import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import * as firestore from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Validate environment variables
const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missingVars.join(', ')}`);
  }
};

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with error handling
let app;
let db;
let storage;
let analytics;

try {
  // Validate config before initialization
  validateFirebaseConfig();
  
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);

  // Initialize Firestore with enhanced persistence configuration
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      // Additional cache settings
      cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache size
    }),
    // Optional: Configure other Firestore settings
    experimentalForceLongPolling: true, // Better for some environments
    // ignoreUndefinedProperties: true, // If you have undefined values in your data
  });

  // Initialize Firebase Storage
  storage = getStorage(app);

  // Initialize Analytics if supported and measurementId is provided
  if (process.env.REACT_APP_FIREBASE_MEASUREMENT_ID) {
    isSupported().then(supported => {
      if (supported) {
        analytics = getAnalytics(app);
      } else {
      }
    }).catch(error => {
    });
  }

  // Emulator configuration for development
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIRESTORE_EMULATOR === 'true') {
    const host = process.env.REACT_APP_FIRESTORE_EMULATOR_HOST || 'localhost';
    const port = process.env.REACT_APP_FIRESTORE_EMULATOR_PORT || 8080;
    
    try {
      connectFirestoreEmulator(db, host, parseInt(port));
    } catch (emulatorError) {
    }
  }

  // Test Firestore connection
  const testConnection = async () => {
    try {
      // Simple test to verify Firestore is working
      const testCollection = firestore.collection(db, '_test_connection');
      await firestore.getDocs(firestore.query(testCollection, firestore.limit(1)));
    } catch (error) {
    }
  };

  // Run connection test after a short delay (reduced for faster loading)
  setTimeout(testConnection, 100);

} catch (error) {
  // Re-throw the error to prevent the app from running with broken Firebase
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

// Export with null checks for safety
export { app, db, storage, analytics };
export default app;
 