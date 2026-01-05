// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCym7nwZ9Hish0KDKOnV2W-ifboyN1hSA8",
  authDomain: "soulsync-alena.firebaseapp.com",
  projectId: "soulsync-alena",
  storageBucket: "soulsync-alena.firebasestorage.app",
  messagingSenderId: "495219554324",
  appId: "1:495219554324:web:56a6ac3bad6cfb2c51cf01",
  measurementId: "G-0NKWE7PE0B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);