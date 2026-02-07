import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tus credenciales reales de PoliParking
const firebaseConfig = {
  apiKey: "AIzaSyDalcjyKgA6ds7g1asdfENU6GZTTfZyYqE",
  authDomain: "poliparking-93499.firebaseapp.com",
  projectId: "poliparking-93499",
  storageBucket: "poliparking-93499.firebasestorage.app",
  messagingSenderId: "245614523278",
  appId: "1:245614523278:web:cafb667153763e0d7e6adf"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos la autenticación y la base de datos para usarlas en toda la app
export const auth = getAuth(app);
export const db = getFirestore(app);