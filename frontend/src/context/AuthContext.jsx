import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";
import {
  getMeApi,
  loginApi,
  registerApi,
  logoutApi
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isCheckingAuth = useRef(false);

  /**
   * Check session validity and retrieve current user profile
   */
  const checkAuth = useCallback(async () => {
    if (isCheckingAuth.current) return;
    isCheckingAuth.current = true;

    try {
      setLoading(true);
      const data = await getMeApi();
      if (data?.success && data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      // 401 unauthenticated or session expired
      setUser(null);
    } finally {
      setLoading(false);
      isCheckingAuth.current = false;
    }
  }, []);

  // Restore authenticated session upon initial page load / refresh
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Authenticate user credentials and establish session
   * @param {object} credentials
   */
  const login = async (credentials) => {
    const data = await loginApi(credentials);
    if (data?.success && data?.user) {
      setUser(data.user);
      return data;
    }
    throw new Error(data?.message || "Login failed");
  };

  /**
   * Register a new user account
   * @param {object} userData
   */
  const register = async (userData) => {
    const data = await registerApi(userData);
    return data;
  };

  /**
   * Terminate session on backend and clear local auth state
   */
  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  };

  /**
   * Update authenticated user state in context
   * @param {object} updatedData
   */
  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      if (!prev) return updatedData;
      return {
        ...prev,
        ...updatedData
      };
    });
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    loading,
    login,
    register,
    logout,
    checkAuth,
    updateUser,
    setLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
