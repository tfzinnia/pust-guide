import { useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "./auth";
import { clearOfflineData } from "../utils/offline";

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
        localStorage.setItem("pust_profile", JSON.stringify(res.data.user));
        setUser(res.data.user);
      } catch (error) {
        if (!error.response && localStorage.getItem("pust_profile")) {
          try {
            setUser(JSON.parse(localStorage.getItem("pust_profile")));
          } catch {
            localStorage.removeItem("pust_profile");
          }
          return;
        }
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

  async function login(identifier, password, role) {
    const res = await api.post("/auth/login", {
      identifier,
      password,
      role,
    });

    localStorage.setItem("pust_token", res.data.token);
    localStorage.setItem("pust_profile", JSON.stringify(res.data.user));
    localStorage.removeItem("pust_guest");

    setUser(res.data.user);
    setIsGuest(false);

    return res.data.user;
  }

  async function studentSignup(formData) {
    return api.post("/auth/student/signup", formData);
  }

  function continueAsGuest() {
    clearOfflineData();
    localStorage.removeItem("pust_token");
    localStorage.setItem("pust_guest", "true");

    setUser(null);
    setIsGuest(true);
  }

  function logout() {
    clearOfflineData();
    localStorage.removeItem("pust_token");
    localStorage.removeItem("pust_guest");

    setUser(null);
    setIsGuest(false);
  }

  useEffect(() => {
    function expire() {
      logout();
    }
    window.addEventListener("pust:session-expired", expire);
    return () => window.removeEventListener("pust:session-expired", expire);
  }, []);

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
        updateUser: (nextUser) => {
          setUser(nextUser);
          localStorage.setItem("pust_profile", JSON.stringify(nextUser));
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
