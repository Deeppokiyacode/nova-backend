import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDXL09cDTzeXJdCLc-Mu4zlVdgmb_dPt9A",
  authDomain: "novaai-1ab64.firebaseapp.com",
  projectId: "novaai-1ab64",
  storageBucket: "novaai-1ab64.firebasestorage.app",
  messagingSenderId: "43316452917",
  appId: "1:43316452917:web:eee1590a4084e3efa89b7c"
};

// Initialize Firebase (sirf ek baar)
const app = initializeApp(firebaseConfig);

// Initialize Authentication & Database
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);