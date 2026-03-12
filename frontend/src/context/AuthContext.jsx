import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

const TOKEN_KEY = "doondo_token";
const USER_KEY = "doondo_user";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  const storeSession = (payload) => {
    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  };

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .getProfile()
      .then((response) => {
        setUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login: async (credentials) => {
        const response = await authService.login(credentials);
        storeSession(response);
        return response;
      },
      register: async (payload) => {
        const response = await authService.register(payload);
        storeSession(response);
        return response;
      },
      logout: clearSession,
      refreshProfile: async () => {
        const response = await authService.getProfile();
        setUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        return response;
      },
      updateUser: (nextUser) => {
        setUser(nextUser);
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      },
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
