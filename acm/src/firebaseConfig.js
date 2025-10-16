import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDoRl-Seu5ARkeEnLDMiWhi6QmYP5xfswk",
  authDomain: "acm-application-5eb4e.firebaseapp.com",
  projectId: "acm-application-5eb4e",
  storageBucket: "acm-application-5eb4e.firebasestorage.app",
  messagingSenderId: "1069610101597",
  appId: "1:1069610101597:web:4a1dbd9a4b01bd66cfd6b4"
};





// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;