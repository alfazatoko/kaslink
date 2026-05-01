import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  where, 
  deleteDoc, 
  getDocs,
  enableIndexedDbPersistence
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDrHGuUG9vVqCPSsy8cOUEBhvG32qJqyWA",
  authDomain: "kaslink-pro.firebaseapp.com",
  projectId: "kaslink-pro",
  storageBucket: "kaslink-pro.firebasestorage.app",
  messagingSenderId: "253740725358",
  appId: "1:253740725358:web:05a13e4f77734ccdc4a27f",
  measurementId: "G-10VXP6CNVL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a a time.
        console.warn('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn('Persistence failed: Browser not supported');
    }
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  where, 
  deleteDoc, 
  getDocs 
};
