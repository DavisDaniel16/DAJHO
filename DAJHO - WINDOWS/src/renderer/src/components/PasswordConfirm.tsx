import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Lock, AlertCircle } from 'lucide-react';

interface PasswordConfirmProps {
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export const PasswordConfirm = ({ onConfirm, onCancel, title, message }: PasswordConfirmProps) => {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) {
      setError('Ingresa la contraseña del propietario');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await window.dajhoAPI.utils.verifyPassword(password);
      // Si handleError capturó un error, result puede ser { success: false, error: '...' }
      if (!result || !result.valid) {
        setError(result?.error || 'Contraseña incorrecta');
        setLoading(false);
        return;
      }
      await onConfirm();
      setPassword('');
      onCancel();
    } catch (err: any) {
      console.error('Error en PasswordConfirm:', err);
      setError(err?.message || 'Error al verificar contraseña');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999,
    }}>
      <div style={{
        backgroundColor: colors.bgCard,
        borderRadius: 16,
        padding: 28,
        width: '90%', maxWidth: 380,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Lock size={36} style={{ color: colors.accent, marginBottom: 8 }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.textHeading, margin: 0 }}>
            {title || 'Confirmar acción'}
          </h3>
          <p style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, margin: 0 }}>
            {message || 'Ingresa la contraseña del propietario para continuar'}
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', backgroundColor: colors.bgDanger,
            borderRadius: 8, color: colors.danger, fontSize: 13,
            marginBottom: 12,
          }}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Contraseña del propietario"
          autoFocus
          style={{
            width: '100%', padding: '10px 14px', fontSize: 14,
            border: `1px solid ${colors.borderInput}`,
            borderRadius: 8, outline: 'none', boxSizing: 'border-box',
            backgroundColor: colors.bgInput, color: colors.textHeading,
            marginBottom: 16,
          }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px', fontSize: 14, borderRadius: 8,
              border: `1px solid ${colors.borderInput}`,
              backgroundColor: colors.buttonSecondary, color: colors.textHeading,
              cursor: 'pointer', fontWeight: 500,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1, padding: '10px', fontSize: 14, borderRadius: 8,
              border: 'none',
              backgroundColor: loading ? colors.borderInput : colors.buttonPrimary,
              color: loading ? colors.textMuted : colors.textOnPrimary,
              cursor: loading ? 'default' : 'pointer', fontWeight: 500,
            }}
          >
            {loading ? 'Verificando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
