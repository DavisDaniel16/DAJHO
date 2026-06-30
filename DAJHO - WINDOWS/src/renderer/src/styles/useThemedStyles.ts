import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from './theme';

/**
 * Hook que devuelve las funciones helper para aplicar colores del tema
 * a estilos en línea de forma fácil.
 */
export const useThemedStyles = () => {
  const { colors } = useTheme();
  return { colors, s: createStyler(colors) };
};

/**
 * Crea un "styler" que aplica colores del tema a estilos existentes.
 *
 * Uso:
 *   const { s } = useThemedStyles();
 *   <div style={s({ backgroundColor: '#fff', color: '#000' }, {
 *     backgroundColor: colors.bgCard,
 *     color: colors.textPrimary,
 *   })}>
 */
const createStyler = (colors: ThemeColors) => {
  return (
    baseStyle: React.CSSProperties,
    themeOverrides?: React.CSSProperties
  ): React.CSSProperties => {
    return { ...baseStyle, ...themeOverrides };
  };
};

/**
 * Tematiza un objeto completo de estilos.
 * Útil para páginas con muchos estilos inline.
 *
 * Uso:
 *   const styles = createThemedStyles(colors, {
 *     container: { backgroundColor: '#fff', ... },
 *     title: { color: '#1a2332', ... },
 *   });
 *
 *   // Resultado:
 *   // styles.container.backgroundColor = colors.bgCard
 *   // styles.title.color = colors.textHeading
 */
export const createThemedStyles = (
  colors: ThemeColors,
  baseStyles: Record<string, React.CSSProperties>,
  overrides: Record<string, Partial<React.CSSProperties>>
): Record<string, React.CSSProperties> => {
  const result: Record<string, React.CSSProperties> = {};
  for (const key of Object.keys(baseStyles)) {
    result[key] = {
      ...baseStyles[key],
      ...(overrides[key] || {}),
    };
  }
  return result;
};
