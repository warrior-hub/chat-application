  import { createContext, useContext, useEffect, useState } from "react";
  import api from "../services/api";

  const AuthContext = createContext();

  export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const token = localStorage.getItem("chat_token");
      const savedUser = localStorage.getItem("chat_user");
      ;
        
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }

      setLoading(false);
    }, []);

    const login = async (email, password) => {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("chat_token", token);
      localStorage.setItem("chat_user", JSON.stringify(user));

      setUser(user);

      return response.data;
    };

    const register = async (name, email, password) => {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("chat_token", token);
      localStorage.setItem("chat_user", JSON.stringify(user));

      setUser(user);

      return response.data;
    };

    const logout = () => {
      localStorage.removeItem("chat_token");
      localStorage.removeItem("chat_user");

      setUser(null);
    };

    return (
      <AuthContext.Provider
        value={{
          user,
          loading,
          login,
          register,
          logout,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  };

  export const useAuth = () => {
    return useContext(AuthContext);
  };