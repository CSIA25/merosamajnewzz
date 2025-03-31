// src/firebase.ts or src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCSINX_-mhb6j_jk84IkJN7r-HheqT3lOQ", // Store securely!
    authDomain: "mero-samaj.firebaseapp.com",
    projectId: "mero-samaj",
    storageBucket: "mero-samaj.firebasestorage.app",
    messagingSenderId: "1012862990546",
    appId: "1:1012862990546:web:209151948e55a3c0d1d50b",
    measurementId: "G-FS7L1HMWGY"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app); // Export auth instance
export const db = getFirestore(app); // Export db instance
export { app };