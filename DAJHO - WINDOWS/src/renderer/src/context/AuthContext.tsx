import { createContext, useState, useContext, useEffect, useCallback, useRef, ReactNode } from 'react';

// Constantes de inactividad
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const WARNING_BEFORE = 60 * 1000; // 1 minuto antes

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
  inactivityWarning: boolean;
  resetInactivityTimer: () => void;
}

// PERMISOS
const PERMISSIONS: Record<string, string[]> = {
  owner: [
    'dashboard', 'vender', 'balance', 'estadisticas', 'inventario', 
    'gastos', 'empleados', 'clientes', 'proveedores', 
    'configuraciones', 'ayuda', 'cerrar-caja', 'recibos', 'categorias'
  ],
  employee: [
    'dashboard', 'vender',
    'cerrar-caja',
    'recibos'  
  ],
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia el timer de inactividad
  const clearInactivityTimer = useCallback(() => {
    if (inactivityRef.current) {
      clearTimeout(inactivityRef.current);
      inactivityRef.current = null;
    }
  }, []);

  // Reinicia el timer de inactividad
  const resetInactivityTimer = useCallback(() => {
    if (!user) return;
    clearInactivityTimer();
    setInactivityWarning(false);

    // Mostrar advertencia 1 minuto antes
    inactivityRef.current = setTimeout(() => {
      setInactivityWarning(true);
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);
  }, [user, clearInactivityTimer]);

  // Configurar listeners de actividad global
  useEffect(() => {
    if (!user) return;

    const activityEvents = ['mousedown', 'keydown', 'mousemove', 'touchstart', 'scroll'];
    const handleActivity = () => resetInactivityTimer();

    activityEvents.forEach(event => window.addEventListener(event, handleActivity));
    resetInactivityTimer();

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
      clearInactivityTimer();
    };
  }, [user, resetInactivityTimer, clearInactivityTimer]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('dajho_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Restaurar sesión en el main process
        window.dajhoAPI.session.login(parsedUser).catch(() => {});
      } catch {
        sessionStorage.removeItem('dajho_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean | string> => {
    setIsLoading(true);

    try {
      const userData = await window.dajhoAPI.users.login(username.toLowerCase().trim(), password);
      
      // Cuenta bloqueada
      if (userData?.blocked) {
        setIsLoading(false);
        return userData.message || 'Cuenta bloqueada';
      }
      
      // Validar que userData sea un objeto de usuario real (con id y role),
      // no un { success: false, error: '...' } de handleError
      if (!userData || !userData.id || !userData.role) {
        setIsLoading(false);
        return false;
      }
      const validUser = userData as User;
      setUser(validUser);
      sessionStorage.setItem('dajho_user', JSON.stringify(validUser));
      // Establecer sesión en el main process (para validación de permisos)
      await window.dajhoAPI.session.login(validUser).catch(() => {});
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error en login:', err);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    clearInactivityTimer();
    setInactivityWarning(false);
    // Cerrar sesión en el main process
    window.dajhoAPI.session.logout().catch(() => {});
    setUser(null);
    sessionStorage.removeItem('dajho_user');
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
      inactivityWarning,
      resetInactivityTimer,
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