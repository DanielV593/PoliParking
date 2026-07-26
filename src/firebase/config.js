import { initializeApp, getApps, deleteApp } from "firebase/app";
import { 
    getAuth, 
    setPersistence, 
    browserSessionPersistence 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDalcjyKgA6ds7g1asdfENU6GZTTfZyYqE",
  authDomain: "poliparking-93499.firebaseapp.com",
  projectId: "poliparking-93499",
  storageBucket: "poliparking-93499.firebasestorage.app",
  messagingSenderId: "245614523278",
  appId: "1:245614523278:web:cafb667153763e0d7e6adf"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    console.log("Persistencia configurada: Cada pestaña es independiente.");
  })
  .catch((error) => {
    console.error("Error configurando la persistencia:", error);
  });

// 🔥 APP SECUNDARIA: sirve únicamente para que un administrador pueda crear
// cuentas nuevas (createUserWithEmailAndPassword) sin que Firebase cierre su
// propia sesión y lo autentique como el usuario recién creado.
// Se crea "al vuelo" y se destruye después de cada uso.
export const getSecondaryAuth = () => {
  const nombreAppSecundaria = "SecundariaCrearUsuarios";
  const appExistente = getApps().find(a => a.name === nombreAppSecundaria);
  const appSecundaria = appExistente || initializeApp(firebaseConfig, nombreAppSecundaria);
  return { appSecundaria, authSecundaria: getAuth(appSecundaria) };
};

export const cerrarAppSecundaria = async (appSecundaria) => {
  try { await deleteApp(appSecundaria); } catch (e) { /* ya estaba cerrada */ }
};