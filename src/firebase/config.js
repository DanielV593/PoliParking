// 1. Importamos las funciones necesarias
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";       
import { getFirestore } from "firebase/firestore"; 
import { getStorage } from "firebase/storage";

// 2. Configuración CORRECTA (PoliParking)
const firebaseConfig = {
  apiKey: "AIzaSyDalcjyKgA6ds7g1asdfENU6GZTTfZyYqE",
  authDomain: "poliparking-93499.firebaseapp.com",
  projectId: "poliparking-93499",
  storageBucket: "poliparking-93499.firebasestorage.app",
  messagingSenderId: "245614523278",
  appId: "1:245614523278:web:cafb667153763e0d7e6adf"
};

// 3. Inicializamos Firebase PRIMERO
const app = initializeApp(firebaseConfig);

// 4. Exportamos los servicios DESPUÉS de inicializar 'app'
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <--- Línea movida aquí abajo