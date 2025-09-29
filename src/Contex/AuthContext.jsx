// src/Contex/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";


const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 🔹 Check kung may naka-save na custom user (manager/member/adviser)
    const storedUser = localStorage.getItem("customUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // 🔹 Check Supabase Auth session (pang Admin lang)
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    getSession();

    // 🔹 Listen sa Supabase Auth changes (para sa Admin lang)
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          localStorage.setItem("adminUser", JSON.stringify(session.user));
        } else {
          setUser(null);
          localStorage.removeItem("adminUser");
        }
      }
    );

    return () => {
      subscription?.subscription.unsubscribe();
    };
  }, []);

  // 🔹 Custom login for Manager/Member/Adviser
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("customUser", JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    localStorage.clear(); // linisin lahat ng localStorage keys
    await supabase.auth.signOut(); // Admin logout kung naka-Supabase
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => useContext(AuthContext);
