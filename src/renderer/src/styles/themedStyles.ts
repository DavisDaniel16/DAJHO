import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from './theme';

/**
 * Hook que toma un objeto base de estilos (con colores fijos)
 * y devuelve una versión con los colores del tema activo.
 *
 * Solo necesitas pasar las propiedades que tienen colores.
 *
 * Uso en una página:
 *
 *   const styles = usePageStyles({
 *     container: { backgroundColor: colors.bgPrimary },
 *     card: { backgroundColor: colors.bgCard, borderColor: colors.border },
 *     title: { color: colors.textHeading },
 *   }, baseStyles);
 *
 * Donde baseStyles es el objeto styles original con colores fijos.
 */
export function usePageStyles<T extends Record<string, React.CSSProperties>>(
  colorOverrides: (colors: ThemeColors) => Partial<Record<keyof T, React.CSSProperties>>,
  baseStyles: T
): T {
  const { colors } = useTheme();

  return useMemo(() => {
    const overrides = colorOverrides(colors);
    const result = { ...baseStyles } as T;
    for (const key of Object.keys(overrides) as Array<keyof T>) {
      if (overrides[key]) {
        result[key] = { ...baseStyles[key], ...overrides[key] } as T[keyof T];
      }
    }
    return result;
  }, [colors, baseStyles]);
}

/**
 * Versión simplificada: devuelve directamente los estilos temáticos.
 *
 * Uso:
 *   const s = useThemedPageStyles(baseStyles, (colors) => ({
 *     container: { backgroundColor: colors.bgPrimary },
 *     title: { color: colors.textHeading },
 *   }));
 *   // s.container, s.title ahora tienen los colores del tema
 */
export function useThemedPageStyles<T extends Record<string, React.CSSProperties>>(
  baseStyles: T,
  getColorOverrides: (colors: ThemeColors) => Partial<Record<keyof T, React.CSSProperties>>
): T {
  const { colors } = useTheme();

  return useMemo(() => {
    const overrides = getColorOverrides(colors);
    const result = { ...baseStyles } as T;
    for (const key of Object.keys(overrides) as Array<keyof T>) {
      if (overrides[key]) {
        result[key] = { ...baseStyles[key], ...overrides[key] } as T[keyof T];
      }
    }
    return result;
  }, [colors, baseStyles]);
}
