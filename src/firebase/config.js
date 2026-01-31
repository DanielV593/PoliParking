import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";       
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyCwnNACddZOy675I0PLKbs_kV_l9-_XGv4",
  authDomain: "proyectogestion-c021a.firebaseapp.com",
  projectId: "proyectogestion-c021a",
  storageBucket: "proyectogestion-c021a.firebasestorage.app",
  messagingSenderId: "568080376655",
  appId: "1:568080376655:web:8db92b5b7436e192bf1b3a",
  measurementId: "G-4KTYQC4R72"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // Esta es la línea clave para el formulario