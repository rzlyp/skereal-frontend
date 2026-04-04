import { createContext, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  return <AuthContext.Provider value={{ user: null, loading: false }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
