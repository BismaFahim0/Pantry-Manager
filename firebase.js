// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

import { useEffect, useState } from 'react';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCmzmyhaq01SmZGhIFrwWUo3RP8HGajF7s",
  authDomain: "pantry-a.firebaseapp.com",
  projectId: "pantry-a",
  storageBucket: "pantry-a.appspot.com",
  messagingSenderId: "982386597789",
  appId: "1:982386597789:web:c19ebf993426c391255974",
  measurementId: "G-B9FJMVTVPK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app)
export {app, firestore}

export const useFirebase = () => {
  const [firebaseApp, setFirebaseApp] = useState(null);

  useEffect(() => {
    // Initialize Firebase only on the client side
    if (typeof window !== 'undefined') {
      const app = initializeApp(firebaseConfig);
      setFirebaseApp(app);
    }
  }, []);

  return firebaseApp ? getFirestore(firebaseApp) : null;
};