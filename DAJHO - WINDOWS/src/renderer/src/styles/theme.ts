// ============================================
// PALETAS DE COLORES - TEMA CLARO Y OSCURO
// ============================================

export interface ThemeColors {
  // Fondos
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgCard: string;
  bgHover: string;
  bgInput: string;
  bgTableHeader: string;
  bgSidebar: string;
  bgSidebarHover: string;
  bgSidebarActive: string;
  bgTopbar: string;
  bgSuccess: string;
  bgDanger: string;
  bgWarning: string;

  // Textos
  textPrimary: string;
  textSecondary: string;
  textHeading: string;
  textOnPrimary: string;
  textSidebar: string;
  textSidebarActive: string;
  textMuted: string;

  // Bordes
  border: string;
  borderLight: string;
  borderInput: string;

  // Botones
  buttonPrimary: string;
  buttonPrimaryHover: string;
  buttonSecondary: string;
  buttonSecondaryBorder: string;
  buttonDanger: string;
  buttonDangerHover: string;
  buttonDangerText: string;

  // Semánticos
  accent: string;
  success: string;
  danger: string;
  warning: string;
  info: string;

  // Sombras
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;

  // Logout button
  logoutBg: string;
  logoutText: string;
  logoutHover: string;
}

export const lightTheme: ThemeColors = {
  bgPrimary: '#f5f7fa',
  bgSecondary: '#ffffff',
  bgTertiary: '#f0f2f5',
  bgCard: '#ffffff',
  bgHover: '#f0f2f5',
  bgInput: '#ffffff',
  bgTableHeader: '#f8faff',
  bgSidebar: '#1a2332',
  bgSidebarHover: '#2a3a4a',
  bgSidebarActive: '#2a3a4a',
  bgTopbar: '#ffffff',
  bgSuccess: '#d4edda',
  bgDanger: '#fee2e2',
  bgWarning: '#fef3cd',

  textPrimary: '#2c3e50',
  textSecondary: '#6b7a8a',
  textHeading: '#1a2332',
  textOnPrimary: '#ffffff',
  textSidebar: '#b0b8c4',
  textSidebarActive: '#ffffff',
  textMuted: '#9aa6b2',

  border: '#e0e4e8',
  borderLight: '#eef1f4',
  borderInput: '#d0d5dd',

  buttonPrimary: '#4a9eff',
  buttonPrimaryHover: '#3a8ef0',
  buttonSecondary: '#f0f4f9',
  buttonSecondaryBorder: '#d0d5dd',
  buttonDanger: '#fee2e2',
  buttonDangerHover: '#fecaca',
  buttonDangerText: '#dc2626',

  accent: '#4a9eff',
  success: '#2ecc71',
  danger: '#e74c3c',
  warning: '#f59e0b',
  info: '#3b82f6',

  shadowSm: '0 1px 3px rgba(0,0,0,0.06)',
  shadowMd: '0 2px 8px rgba(0,0,0,0.08)',
  shadowLg: '0 4px 16px rgba(0,0,0,0.1)',

  logoutBg: '#fee2e2',
  logoutText: '#dc2626',
  logoutHover: '#fecaca',
};

export const darkTheme: ThemeColors = {
  bgPrimary: '#0f1729',
  bgSecondary: '#1a2332',
  bgTertiary: '#222d3d',
  bgCard: '#1e293b',
  bgHover: '#2a3a4a',
  bgInput: '#1e293b',
  bgTableHeader: '#222d3d',
  bgSidebar: '#0f1729',
  bgSidebarHover: '#1a2332',
  bgSidebarActive: '#1e293b',
  bgTopbar: '#1a2332',
  bgSuccess: '#064e3b',
  bgDanger: '#7f1d1d',
  bgWarning: '#78350f',

  textPrimary: '#e2e8f0',
  textSecondary: '#94a3b8',
  textHeading: '#f1f5f9',
  textOnPrimary: '#ffffff',
  textSidebar: '#94a3b8',
  textSidebarActive: '#f1f5f9',
  textMuted: '#64748b',

  border: '#2a3a4a',
  borderLight: '#1e293b',
  borderInput: '#334155',

  buttonPrimary: '#3b82f6',
  buttonPrimaryHover: '#2563eb',
  buttonSecondary: '#1e293b',
  buttonSecondaryBorder: '#334155',
  buttonDanger: '#7f1d1d',
  buttonDangerHover: '#991b1b',
  buttonDangerText: '#fca5a5',

  accent: '#4a9eff',
  success: '#4caf50',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#60a5fa',

  shadowSm: '0 1px 3px rgba(0,0,0,0.3)',
  shadowMd: '0 2px 8px rgba(0,0,0,0.4)',
  shadowLg: '0 4px 16px rgba(0,0,0,0.5)',

  logoutBg: '#7f1d1d',
  logoutText: '#fca5a5',
  logoutHover: '#991b1b',
};

// ============================================
// MAPEO AUTOMÁTICO DE COLORES PARA TEMA OSCURO
// ============================================

/**
 * Aplica colores del tema oscuro a un objeto de estilos,
 * reemplazando automáticamente los colores fijos del tema claro
 * por sus equivalentes en el tema oscuro.
 *
 * Soporta: backgroundColor, color, border*, boxShadow
 */
export function applyThemeToStyles(
  styles: Record<string, React.CSSProperties>,
  colors: ThemeColors,
  isDark: boolean
): Record<string, React.CSSProperties> {
  if (!isDark) return styles;

  // Mapeo de colores fijos claros -> variables del tema oscuro
  const colorReplacements: [string, string][] = [
    // Fondos
    ['#ffffff', colors.bgCard],
    ['#f0f4f9', colors.bgTertiary],
    ['#f8faff', colors.bgTableHeader],
    ['#f5f7fa', colors.bgPrimary],
    ['#f0f2f5', colors.bgTertiary],
    ['#fee2e2', colors.bgDanger],
    ['#d4edda', colors.bgSuccess],
    ['#f8d7da', colors.bgDanger],
    ['#fef3cd', colors.bgWarning],
    ['#dbeafe', '#1e3a5f'],
    ['#f8fafc', colors.bgTertiary],
    // Textos
    ['#1a2332', colors.textHeading],
    ['#2c3e50', colors.textPrimary],
    ['#6b7a8a', colors.textSecondary],
    ['#9aa6b2', colors.textMuted],
    ['#155724', colors.success],
    ['#721c24', colors.danger],
    ['#dc2626', colors.danger],
    ['#1e40af', '#60a5fa'],
    // Bordes
    ['#e0e4e8', colors.border],
    ['#d0d5dd', colors.borderInput],
    ['#e8ecf0', colors.border],
    ['#eef1f4', colors.borderLight],
    // Sombras
    ['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.3)'],
    ['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.4)'],
    ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)'],
    ['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.3)'],
  ];

  const result: Record<string, React.CSSProperties> = {};

  for (const key of Object.keys(styles)) {
    const style = styles[key];
    if (!style) {
      result[key] = style;
      continue;
    }

    const newStyle: Record<string, string> = {};
    for (const [prop, val] of Object.entries(style)) {
      if (typeof val === 'string') {
        let newVal = val;
        for (const [from, to] of colorReplacements) {
          if (newVal.includes(from)) {
            newVal = newVal.replaceAll(from, to);
          }
        }
        newStyle[prop] = newVal;
      } else {
        (newStyle as any)[prop] = val;
      }
    }
    result[key] = newStyle as React.CSSProperties;
  }

  return result;
}
