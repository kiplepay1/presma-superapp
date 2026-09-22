import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Public client config — safe to expose. Real security is enforced by the
// Firestore security rules (see project README), not by hiding this object.
const firebaseConfig = {
  apiKey: "AIzaSyA8axhmVPLuPu_j9DC8BZ7llEYzCD-CpX8",
  authDomain: "presma-superapp.firebaseapp.com",
  projectId: "presma-superapp",
  storageBucket: "presma-superapp.firebasestorage.app",
  messagingSenderId: "302069088245",
  appId: "1:302069088245:web:863b4d4825ff85801daabc",
};

export const ADMIN_EMAIL = "mohamedridzuan1988@gmail.com";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
