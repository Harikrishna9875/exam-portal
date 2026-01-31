// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhPp7_YxzQR3mECGhfFNcK4uPCHMczzww",
  authDomain: "exam-portal-b9198.firebaseapp.com",
  projectId: "exam-portal-b9198",
  storageBucket: "exam-portal-b9198.firebasestorage.app",
  messagingSenderId: "395085595366",
  appId: "1:395085595366:web:8d9267af4961dc9638f127"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);