import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-PNODScbGy7MMK3pZ6kmcljILm9BN6PU",
  authDomain: "kotaniapp-4f017.firebaseapp.com",
  projectId: "kotaniapp-4f017",
  storageBucket: "kotaniapp-4f017.firebasestorage.app",
  messagingSenderId: "623409374889",
  appId: "1:623409374889:web:1931dc594ed5d4fd23abb8"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
