import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyA6vNE1RkBcDIWm5T4lz73nEjQnG6Lh__4",
  authDomain: "collegedb-ae81c.firebaseapp.com",
  projectId: "collegedb-ae81c",
  storageBucket: "collegedb-ae81c.firebasestorage.app",
  messagingSenderId: "321460805134",
  appId: "1:321460805134:web:8b1d1ba445acc7f551265f",
  measurementId: "G-CTGWXE7KB1"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Safe analytics initializer
export const initAnalytics = async () => {
  if (typeof window !== "undefined" && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export { app, auth, googleProvider };
