import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "",
  authDomain: "breaker-circuit-pro.firebaseapp.com",
  projectId: "breaker-circuit-pro",
  storageBucket: "breaker-circuit-pro.firebasestorage.app",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase App only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services with the singleton app instance
export const auth = getAuth(app);
export const storage = getStorage(app);

// Use initializeFirestore with optimized local caching
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ 
    tabManager: persistentMultipleTabManager() 
  }),
  experimentalForceLongPolling: true,
});

// Auth Provider Configuration
export const googleProvider = new GoogleAuthProvider();

export default app;
