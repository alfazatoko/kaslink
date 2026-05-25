import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updatePassword
} from "firebase/auth";

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
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updatePassword
};
