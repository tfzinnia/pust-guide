import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const guest = localStorage.getItem("pust_guest");
        const token = localStorage.getItem("pust_token");

        if (guest === "true") {
          setIsGuest(true);
          setLoading(false);
          return;
        }

        if (!token) {
          setLoading(false);
          return;
        }

        const res = await api.get("/auth/me");
        setUser(res.data.user);
      } catch {
        localStorage.removeItem("pust_token");
        localStorage.removeItem("pust_guest");
        setUser(null);
        setIsGuest(false);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  async function login(identifier, password) {
    const res = await api.post("/auth/login", {
      identifier,
      password,
    });

    localStorage.setItem("pust_token", res.data.token);
    localStorage.removeItem("pust_guest");

    setUser(res.data.user);
    setIsGuest(false);

    return res.data.user;
  }

  async function studentSignup(formData) {
    return api.post("/auth/student/signup", formData);
  }

  function continueAsGuest() {
    localStorage.removeItem("pust_token");
    localStorage.setItem("pust_guest", "true");

    setUser(null);
    setIsGuest(true);
  }

  function logout() {
    localStorage.removeItem("pust_token");
    localStorage.removeItem("pust_guest");

    setUser(null);
    setIsGuest(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        loading,
        login,
        studentSignup,
        continueAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}