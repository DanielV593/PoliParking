import React, { createContext, useState, useEffect, useContext } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/config.js"; 
import { collection, query, where, getDocs } from "firebase/firestore";

export const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser debe usarse dentro de un UserProvider");
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // No activamos loading aquí para evitar parpadeos, solo al inicio
      
      if (currentUser) {
        try {
          // 🔥 CAMBIO CRÍTICO: Buscamos por EMAIL, igual que en tu Login
          const q = query(collection(db, "usuarios"), where("email", "==", currentUser.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            // Mezclamos los datos de Auth con los de Firestore (nombre, placa, rol)
            setUser({ ...currentUser, ...docData });
          } else {
            // Si no hay datos en Firestore, usamos lo básico de Auth
            setUser(currentUser);
          }
        } catch (error) {
          console.error("Error cargando usuario:", error);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false); // ¡Apagamos la pantalla blanca!
    });
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};