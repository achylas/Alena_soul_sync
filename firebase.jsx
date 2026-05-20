import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCym7nwZ9Hish0KDKOnV2W-ifboyN1hSA8",
  authDomain: "soulsync-alena.firebaseapp.com",
  projectId: "soulsync-alena",
  storageBucket: "soulsync-alena.firebasestorage.app",
  messagingSenderId: "495219554324",
  appId: "1:495219554324:web:56a6ac3bad6cfb2c51cf01",
  measurementId: "G-0NKWE7PE0B"
};

// Initialize Firebasbre
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)

// Analytics is optional — initialize lazily so ad blockers don't crash the app
import('firebase/analytics')
  .then(({ getAnalytics }) => getAnalytics(app))
  .catch(() => {
    // Analytics blocked or unavailable — non-fatal, app continues normally
  })