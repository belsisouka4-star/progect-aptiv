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
    console.error('Missing required Firebase environment variables:', missingVars);
    
    // Provide helpful development message
    if (process.env.NODE_ENV === 'development') {
      console.info(`
      Please create a .env file in your project root with the following variables:
      
      REACT_APP_FIREBASE_API_KEY=your_api_key
      REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
      REACT_APP_FIREBASE_PROJECT_ID=your_project_id
      REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
      REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
      REACT_APP_FIREBASE_APP_ID=your_app_id
      REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
      `);
    }
    
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
  console.log('Firebase app initialized successfully');

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
  console.log('Firebase Storage initialized successfully');

  // Initialize Analytics if supported and measurementId is provided
  if (process.env.REACT_APP_FIREBASE_MEASUREMENT_ID) {
    isSupported().then(supported => {
      if (supported) {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized');
      } else {
        console.log('Firebase Analytics not supported in this environment');
      }
    }).catch(error => {
      console.warn('Firebase Analytics initialization failed:', error);
    });
  }

  // Emulator configuration for development
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIRESTORE_EMULATOR === 'true') {
    const host = process.env.REACT_APP_FIRESTORE_EMULATOR_HOST || 'localhost';
    const port = process.env.REACT_APP_FIRESTORE_EMULATOR_PORT || 8080;
    
    try {
      connectFirestoreEmulator(db, host, parseInt(port));
      console.log(`Firestore emulator connected: ${host}:${port}`);
    } catch (emulatorError) {
      console.warn('Failed to connect to Firestore emulator:', emulatorError);
    }
  }

  // Test Firestore connection
  const testConnection = async () => {
    try {
      // Simple test to verify Firestore is working
      const testCollection = firestore.collection(db, '_test_connection');
      await firestore.getDocs(firestore.query(testCollection, firestore.limit(1)));
      console.log('Firestore connection test passed');
    } catch (error) {
      console.warn('Firestore connection test failed (this might be normal if no documents exist):', error);
    }
  };

  // Run connection test after a short delay (reduced for faster loading)
  setTimeout(testConnection, 100);

} catch (error) {
  console.error('Firebase initialization failed:', error);
  
  // Provide more specific error messages
  if (error.code === 'app/duplicate-app') {
    console.error('Firebase app was already initialized. Make sure you are not initializing Firebase multiple times.');
  } else if (error.code === 'app/invalid-app-argument') {
    console.error('Invalid Firebase configuration. Please check your environment variables.');
  }
  
  // Re-throw the error to prevent the app from running with broken Firebase
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

// Export with null checks for safety
export { app, db, storage, analytics };
export default app;
