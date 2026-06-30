import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Clock } from 'lucide-react';

export const InactivityModal = () => {
  const { isAuthenticated, inactivityWarning, resetInactivityTimer } = useAuth();
  const { colors } = useTheme();
  
  if (!isAuthenticated || !inactivityWarning) return null;

  return React.createElement(
    'div',
    {
      style: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999,
      },
    },
    React.createElement(
      'div',
      {
        style: {
          backgroundColor: colors.bgCard,
          borderRadius: 16, padding: 32,
          width: '90%', maxWidth: 400,
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        },
      },
      React.createElement(Clock, { size: 48, color: '#f59e0b', style: { marginBottom: 12 } }),
      React.createElement('h3', {
        style: { fontSize: 18, fontWeight: 600, color: colors.textHeading, margin: '0 0 8px 0' },
      }, '¿Sigues ahi?'),
      React.createElement('p', {
        style: { fontSize: 14, color: colors.textSecondary, margin: '0 0 20px 0' },
      }, 'Tu sesion se cerrara por inactividad en menos de 1 minuto.'),
      React.createElement('button', {
        onClick: resetInactivityTimer,
        style: {
          padding: '12px 28px',
          backgroundColor: colors.buttonPrimary,
          color: colors.textOnPrimary,
          border: 'none', borderRadius: 10,
          fontSize: 15, fontWeight: 600,
          cursor: 'pointer',
        },
      }, 'Seguir aqui')
    )
  );
};
