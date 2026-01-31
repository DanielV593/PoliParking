// 1. Importamos las funciones necesarias
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";       
import { getFirestore } from "firebase/firestore"; 

// 2. Configuración CORRECTA (PoliParking)
const firebaseConfig = {
  apiKey: "AIzaSyDalcjyKgA6ds7g1asdfENU6GZTTfZyYqE",
  authDomain: "poliparking-93499.firebaseapp.com",
  projectId: "poliparking-93499",
  storageBucket: "poliparking-93499.firebasestorage.app",
  messagingSenderId: "245614523278",
  appId: "1:245614523278:web:cafb667153763e0d7e6adf"
};

// 3. Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// 4. Exportamos la Auth y la Base de Datos para usarlas en la app
export const auth = getAuth(app);
export const db = getFirestore(app);