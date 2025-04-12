// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getAuth } from "firebase/auth";
import { getStorage } from 'firebase/storage'; // Import Authentication

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBL9BSfmHkvMkgFJG23HFfcMhdTtoWfSA8",
  authDomain: "garagy-be2b2.firebaseapp.com",
  projectId: "garagy-be2b2",
  storageBucket: "garagy-be2b2.firebasestorage.app",
  messagingSenderId: "981052101365",
  appId: "1:981052101365:web:64b1f94a8c8a4ce4202bbc",
  measurementId: "G-NYD1SDL57H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);
const storage = getStorage(app);
// Export Firebase services

export { db, auth, storage };