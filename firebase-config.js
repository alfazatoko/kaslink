
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrHGuUG9vVqCPSsy8cOUEBhvG32qJqyWA",
  authDomain: "kaslink-pro.firebaseapp.com",
  projectId: "kaslink-pro",
  storageBucket: "kaslink-pro.firebasestorage.app",
  messagingSenderId: "253740725358",
  appId: "1:253740725358:web:05a13e4f77734ccdc4a27f",
  measurementId: "G-10VXP6CNVL"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, where, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, doc, getDoc, setDoc, updateDoc, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, where, deleteDoc, getDocs };


