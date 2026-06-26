import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Login } from './pages/Login';

// Importar todas las páginas
import { Sales } from './pages/Sales';
import { Balance } from './pages/Balance';
import { Statistics } from './pages/Statistics';
import { Inventory } from './pages/Inventory';
import { Expenses } from './pages/Expenses';
import { Employees } from './pages/Employees';
import { Clients } from './pages/Clients';
import { Suppliers } from './pages/Suppliers';
import { Settings } from './pages/Settings';
import { CerrarCaja } from './pages/CerrarCaja';
import { Recibos } from './pages/Recibos';


// Componente que protege las rutas
const ProtectedRoute = ({ children, module }: { children: React.ReactNode; module?: string }) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <div style={{
        ...styles.loadingContainer,
        backgroundColor: colors.bgPrimary,
      }}>
        <div style={styles.loadingSpinner}>⏳</div>
        <p style={{ ...styles.loadingText, color: colors.textSecondary }}>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (module && !hasPermission(module)) {
    return (
      <div style={{
        ...styles.unauthorizedContainer,
        backgroundColor: colors.bgPrimary,
      }}>
        <div style={styles.unauthorizedIcon}>🚫</div>
        <h2 style={{
          ...styles.unauthorizedTitle,
          color: colors.textHeading,
        }}>Acceso denegado</h2>
        <p style={{
          ...styles.unauthorizedText,
          color: colors.textSecondary,
        }}>No tienes permisos para acceder a esta sección.</p>
        <p style={{
          ...styles.unauthorizedSubtext,
          color: colors.textSecondary,
        }}>Contacta al administrador si necesitas acceso.</p>
      </div>
    );
  }

  return <>{children}</>;
};

// Layout principal con sidebar
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  return (
    <div style={{
      ...styles.app,
      backgroundColor: colors.bgPrimary,
    }}>
      <Sidebar />
      <div style={{
        ...styles.main,
        backgroundColor: colors.bgPrimary,
      }}>
        <TopBar user={user} />
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Componente App interno (con autenticación)
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <div style={{
        ...styles.loadingContainer,
        backgroundColor: colors.bgPrimary,
      }}>
        <div style={styles.loadingSpinner}>⏳</div>
        <p style={{ ...styles.loadingText, color: colors.textSecondary }}>Cargando...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Login - si ya está autenticado, redirige a /vender */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/vender" replace /> : <Login />} 
      />
      
      {/* Ruta raíz - redirige a /vender si está autenticado, o a /login si no */}
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/vender" : "/login"} replace />} 
      />
      
      {/* Rutas protegidas */}
      <Route path="/vender" element={
        <ProtectedRoute module="vender">
          <MainLayout>
            <Sales />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/cerrar-caja" element={
        <ProtectedRoute module="cerrar-caja">
          <MainLayout>
            <CerrarCaja />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/balance" element={
        <ProtectedRoute module="balance">
          <MainLayout>
            <Balance />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/estadisticas" element={
        <ProtectedRoute module="estadisticas">
          <MainLayout>
            <Statistics />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/inventario" element={
        <ProtectedRoute module="inventario">
          <MainLayout>
            <Inventory />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/gastos" element={
        <ProtectedRoute module="gastos">
          <MainLayout>
            <Expenses />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/empleados" element={
        <ProtectedRoute module="empleados">
          <MainLayout>
            <Employees />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/clientes" element={
        <ProtectedRoute module="clientes">
          <MainLayout>
            <Clients />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/proveedores" element={
        <ProtectedRoute module="proveedores">
          <MainLayout>
            <Suppliers />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuraciones" element={
        <ProtectedRoute module="configuraciones">
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/recibos" element={
        <ProtectedRoute module="recibos">
          <MainLayout>
            <Recibos />
          </MainLayout>
        </ProtectedRoute>
      } />
            
      {/* Rutas para páginas extra */}
      <Route path="/ayuda" element={
        <ProtectedRoute>
          <MainLayout>
            <div style={styles.placeholder}>❓ Ayuda</div>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Redireccionar cualquier otra ruta */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// App principal
function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

// Estilos
const styles: { [key: string]: React.CSSProperties } = {
  app: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f5f7fa',
  },
  main: {
    flex: 1,
    marginLeft: '240px',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    marginTop: '64px',
    overflowY: 'auto' as 'auto',
    padding: '20px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f7fa',
  },
  loadingSpinner: {
    fontSize: '48px',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7a8a',
    marginTop: '12px',
  },
  unauthorizedContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '20px',
  },
  unauthorizedIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  unauthorizedTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '8px',
  },
  unauthorizedText: {
    fontSize: '16px',
    color: '#6b7a8a',
    textAlign: 'center',
  },
  unauthorizedSubtext: {
    fontSize: '14px',
    color: '#6b7a8a',
    textAlign: 'center',
    marginTop: '4px',
  },
  placeholder: {
    padding: '40px',
    fontSize: '18px',
    color: '#6b7a8a',
  },
};

// Agregar keyframes para el spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default App;