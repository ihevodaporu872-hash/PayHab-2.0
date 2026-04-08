import { createContext, useContext, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { authApi } from '../services/api';

interface IAuthContext {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<IAuthContext>({
  token: null,
  username: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface IAuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<IAuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('payhab_token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('payhab_username'));

  useEffect(() => {
    if (token) {
      localStorage.setItem('payhab_token', token);
    } else {
      localStorage.removeItem('payhab_token');
    }
  }, [token]);

  const login = async (user: string, password: string) => {
    const result = await authApi.login(user, password);
    setToken(result.access_token);
    setUsername(user);
    localStorage.setItem('payhab_username', user);
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('payhab_token');
    localStorage.removeItem('payhab_username');
  };

  return (
    <AuthContext.Provider value={{ token, username, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
