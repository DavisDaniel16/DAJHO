import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InactivityModal } from './components/InactivityModal';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { Ban } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { Login } from './pages/Login';
import { ErrorBoundary } from './components/ErrorBoundary';

// Carga diferida (lazy) para reducir tamaño del bundle inicial
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Sales = lazy(() => import('./pages/Sales').then(m => ({ default: m.Sales })));
const Balance = lazy(() => import('./pages/Balance').then(m => ({ default: m.Balance })));
const Statistics = lazy(() => import('./pages/Statistics').then(m => ({ default: m.Statistics })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Expenses = lazy(() => import('./pages/Expenses').then(m => ({ default: m.Expenses })));
const Employees = lazy(() => import('./pages/Employees').then(m => ({ default: m.Employees })));
const Clients = lazy(() => import('./pages/Clients').then(m => ({ default: m.Clients })));
const Suppliers = lazy(() => import('./pages/Suppliers').then(m => ({ default: m.Suppliers })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const CerrarCaja = lazy(() => import('./pages/CerrarCaja').then(m => ({ default: m.CerrarCaja })));
const Recibos = lazy(() => import('./pages/Recibos').then(m => ({ default: m.Recibos })));
const Ayuda = lazy(() => import('./pages/Ayuda').then(m => ({ default: m.Ayuda })));
const Categories = lazy(() => import('./pages/Categories').then(m => ({ default: m.Categories })));

const PageLoader = () => {
  const { colors } = useTheme();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)', color: colors.textSecondary, fontSize: 14, backgroundColor: colors.bgPrimary }}>
      Cargando...
    </div>
  );
};

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
        <Ban size={48} style={{ marginBottom: 16, color: '#ef4444' }} />
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

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { sidebarWidth } = useSidebar();
  return (
    <div style={{
      ...styles.app,
      backgroundColor: colors.bgPrimary,
    }}>
      <Sidebar />
      <div style={{
        ...styles.main,
        marginLeft: sidebarWidth + 'px',
        backgroundColor: colors.bgPrimary,
      }}>
        <TopBar user={user} />
        <div style={{
          ...styles.content,
          backgroundColor: colors.bgPrimary,
        }}>
          {children}
        </div>
      </div>
      <InactivityModal />
    </div>
  );
};

// Componente App interno (con autenticación)
const AppContent = () => {
  const { isAuthenticated, isLoading, inactivityWarning, resetInactivityTimer } = useAuth();
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
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      
      <Route 
        path="/" 
        element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} 
      />
      
      <Route path="/dashboard" element={
        <ProtectedRoute module="dashboard">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Dashboard /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/vender" element={
        <ProtectedRoute module="vender">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Sales /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/cerrar-caja" element={
        <ProtectedRoute module="cerrar-caja">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><CerrarCaja /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/balance" element={
        <ProtectedRoute module="balance">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Balance /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/estadisticas" element={
        <ProtectedRoute module="estadisticas">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Statistics /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/inventario" element={
        <ProtectedRoute module="inventario">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Inventory /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/gastos" element={
        <ProtectedRoute module="gastos">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Expenses /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/empleados" element={
        <ProtectedRoute module="empleados">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Employees /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/clientes" element={
        <ProtectedRoute module="clientes">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Clients /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/proveedores" element={
        <ProtectedRoute module="proveedores">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Suppliers /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/configuraciones" element={
        <ProtectedRoute module="configuraciones">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Settings /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/recibos" element={
        <ProtectedRoute module="recibos">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Recibos /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/ayuda" element={
        <ProtectedRoute module="ayuda">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Ayuda /></Suspense>
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/categorias" element={
        <ProtectedRoute module="categorias">
          <MainLayout>
            <Suspense fallback={<PageLoader />}><Categories /></Suspense>
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
    <ErrorBoundary>
      <HashRouter>
        <ThemeProvider>
          <SidebarProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          </SidebarProvider>
        </ThemeProvider>
      </HashRouter>
    </ErrorBoundary>
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
    backgroundColor: '#f5f7fa',
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