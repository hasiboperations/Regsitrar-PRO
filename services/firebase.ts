import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

/**
 * NOTE FOR DEVELOPER:
 * If you encounter "requests... are blocked", please verify:
 * 1. Firebase Console > Authentication > Sign-in method: Enable "Email/Password".
 * 2. Google Cloud Console > APIs & Services > Credentials: Check API Key restrictions.
 *    Ensure "Identity Toolkit API" is allowed.
 */
const firebaseConfig = {
  apiKey: "AIzaSyATbh8sU3BzlIYJ7MbpLrwhyEW0qhnJ33M",
  authDomain: "ai-registrar-hasib.firebaseapp.com",
  projectId: "ai-registrar-hasib",
  storageBucket: "ai-registrar-hasib.firebasestorage.app",
  messagingSenderId: "980339577224",
  appId: "1:980339577224:web:15223a810561227b172a3d"
};

// Initialize Firebase app idempotently to prevent re-initialization.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export the Firestore service.
export const db = firebase.firestore();