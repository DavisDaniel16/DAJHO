import { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Definir tipos
export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'owner' | 'employee';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (module: string) => boolean;
}

// ✅ PERMISOS
const PERMISSIONS: Record<string, string[]> = {
  owner: [
    'vender', 'balance', 'estadisticas', 'inventario', 
    'gastos', 'empleados', 'clientes', 'proveedores', 
    'configuraciones', 'ayuda', 'cerrar-caja', 'recibos'
  ],
  employee: [
    'vender',
    'cerrar-caja',
    'recibos'  
  ],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('dajho_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('dajho_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const userData = await window.dajhoAPI.users.login(username.toLowerCase().trim(), password);
      if (!userData) {
        setIsLoading(false);
        return false;
      }
      setUser(userData as User);
      localStorage.setItem('dajho_user', JSON.stringify(userData));
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error en login:', err);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dajho_user');
  };

  const hasPermission = (module: string): boolean => {
    if (!user) return false;
    const allowedModules = PERMISSIONS[user.role] || [];
    return allowedModules.includes(module);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};