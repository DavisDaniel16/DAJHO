import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  HelpCircle, BookOpen, Mail, MessageCircle, FileText,
  ChevronDown, ChevronUp, ExternalLink, ShoppingBag, DollarSign,
  Wallet, BarChart3, Package, Users, Building2, Settings as SettingsIcon
} from 'lucide-react';

type SectionKey = 'intro' | 'ventas' | 'inventario' | 'balance' | 'empleados' | 'contactos' | 'configuracion' | 'soporte';

const SECTIONS: Record<SectionKey, { title: string; icon: React.ReactNode; content: string[] }> = {
  intro: {
    title: 'Bienvenido a DAJHO',
    icon: <HelpCircle size={20} />,
    content: [
      'DAJHO es un sistema de gestión empresarial diseñado para pequeños y medianos negocios.',
      'Con DAJHO puedes administrar ventas, inventario, empleados, clientes, proveedores, gastos y más, todo desde una sola aplicación de escritorio.',
      'Los datos se almacenan localmente en tu computadora usando SQLite, lo que garantiza rapidez y privacidad.',
    ],
  },
  ventas: {
    title: 'Módulo de Ventas',
    icon: <ShoppingBag size={20} />,
    content: [
      'Accede desde el menú lateral → "Vender" o presiona F2.',
      'Busca productos por nombre o código de barras.',
      'Haz clic en "Agregar" o presiona Enter para añadir al carrito.',
      'Puedes cambiar el precio unitario haciendo clic en el precio del carrito.',
      'Selecciona el cliente (opcional) y el método de pago (Efectivo o Transferencia).',
      'Si es Transferencia, ingresa el número de comprobante.',
      'Al finalizar, puedes descargar una Nota de Venta en PDF.',
      'Los recibos se guardan automáticamente en el historial.',
    ],
  },
  inventario: {
    title: 'Módulo de Inventario',
    icon: <Package size={20} />,
    content: [
      'Administra tus productos: crea, edita, elimina y consulta stock.',
      'Puedes importar productos desde Excel (.xlsx) y exportar tu inventario.',
      'Define un stock mínimo; los productos con bajo stock se marcan en rojo.',
      'Cada producto puede tener: nombre, precio, costo, categoría, talla, color y código de barras.',
    ],
  },
  balance: {
    title: 'Módulo de Balance',
    icon: <Wallet size={20} />,
    content: [
      'Consulta todas las transacciones (ingresos por ventas y egresos por gastos).',
      'Usa los filtros por período: Hoy, Esta semana, Este mes, Personalizado.',
      'Puedes crear movimientos manuales (ingresos o egresos) desde el botón "Crear movimiento".',
      'Usa el buscador para filtrar por concepto o categoría.',
    ],
  },
  empleados: {
    title: 'Módulo de Empleados',
    icon: <Users size={20} />,
    content: [
      'Gestiona los empleados de tu negocio.',
      'Cada empleado tiene un usuario y contraseña para acceder al sistema.',
      'Los empleados tienen permisos limitados (solo pueden vender y ver recibos).',
      'Solo el propietario puede crear, editar o eliminar empleados.',
      'Puedes activar/desactivar empleados desde la lista.',
    ],
  },
  contactos: {
    title: 'Clientes y Proveedores',
    icon: <Building2 size={20} />,
    content: [
      'Clientes: registra la información de tus compradores. Puedes ver su historial de deudas y compras.',
      'Proveedores: administra tus proveedores, incluyendo datos de contacto y tipos de productos que ofrecen.',
      'Ambos módulos permiten buscar, filtrar y exportar datos.',
    ],
  },
  configuracion: {
    title: 'Configuración',
    icon: <SettingsIcon size={20} />,
    content: [
      'Configura los datos de tu negocio: nombre, RUC, dirección, teléfono, email.',
      'Personaliza la apariencia: tema oscuro/claro.',
      'Gestiona los usuarios del sistema.',
      'Puedes hacer respaldo manual de la base de datos desde la sección "Base de Datos".',
      'La aplicación respalda automáticamente la BD al iniciar.',
    ],
  },
  soporte: {
    title: 'Soporte Técnico',
    icon: <MessageCircle size={20} />,
    content: [
      'Para reportar errores o solicitar ayuda:',
      'Email: davisvacacela@gmail.com',
      'WhatsApp: +593 98 662 7675',
      'Documentación: próximamente en dajho.com/docs',
      'Versión actual: 1.0.0',
      'Los datos se almacenan en: %APPDATA%/dajho-desktop/',
    ],
  },
};

const SECTION_ORDER: SectionKey[] = ['intro', 'ventas', 'inventario', 'balance', 'empleados', 'contactos', 'configuracion', 'soporte'];

export const Ayuda = () => {
  const { colors } = useTheme();
  const [openSection, setOpenSection] = useState<SectionKey | null>('intro');

  const toggleSection = (section: SectionKey) => {
    setOpenSection(openSection === section ? null : section);
  };

  const styles = useMemo(() => ({
    container: {
      padding: '24px',
      maxWidth: '900px',
      margin: '0 auto',
    } as React.CSSProperties,
    title: {
      fontSize: '28px',
      fontWeight: '600',
      color: colors.textHeading,
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    } as React.CSSProperties,
    subtitle: {
      fontSize: '14px',
      color: colors.textSecondary,
      marginBottom: '24px',
    } as React.CSSProperties,
    section: {
      marginBottom: '8px',
      borderRadius: '10px',
      overflow: 'hidden',
      border: `1px solid ${colors.border}`,
    } as React.CSSProperties,
    sectionHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 18px',
      backgroundColor: colors.bgCard,
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'background 0.2s',
    } as React.CSSProperties,
    sectionHeaderLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '15px',
      fontWeight: '600',
      color: colors.textHeading,
    } as React.CSSProperties,
    getSectionContent: (isOpen: boolean) => ({
      padding: isOpen ? '6px 18px 18px' : '0 18px',
      maxHeight: isOpen ? '2000px' : '0',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      backgroundColor: colors.bgSecondary,
    } as React.CSSProperties),
    list: {
      margin: '4px 0',
      padding: '0 0 0 20px',
      color: colors.textPrimary,
      fontSize: '14px',
      lineHeight: '1.8',
    } as React.CSSProperties,
    listItem: {
      marginBottom: '4px',
    } as React.CSSProperties,
    paragraph: {
      color: colors.textPrimary,
      fontSize: '14px',
      lineHeight: '1.7',
      marginBottom: '10px',
    } as React.CSSProperties,
    footer: {
      marginTop: '32px',
      padding: '16px',
      backgroundColor: colors.bgCard,
      borderRadius: '10px',
      border: `1px solid ${colors.border}`,
      textAlign: 'center' as const,
    } as React.CSSProperties,
    footerTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: colors.textHeading,
      marginBottom: '8px',
    } as React.CSSProperties,
    footerText: {
      fontSize: '13px',
      color: colors.textSecondary,
      marginBottom: '4px',
    } as React.CSSProperties,
    badge: {
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600',
      backgroundColor: colors.accent + '20',
      color: colors.accent,
      marginLeft: '8px',
    } as React.CSSProperties,
  }), [colors, openSection]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        <BookOpen size={28} /> Centro de Ayuda
      </h1>
      <p style={styles.subtitle}>
        Encuentra respuestas a tus preguntas sobre DAJHO
      </p>

      {SECTION_ORDER.map((key) => {
        const section = SECTIONS[key];
        const isOpen = openSection === key;
        return (
          <div key={key} style={styles.section}>
            <div
              style={styles.sectionHeader}
              onClick={() => toggleSection(key)}
            >
              <div style={styles.sectionHeaderLeft}>
                {section.icon}
                <span>{section.title}</span>
              </div>
              {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            <div style={styles.getSectionContent(isOpen)}>
              {section.content.map((line, i) => (
                line.startsWith('•') || line.startsWith('-') || line.match(/^\d+\./) ? (
                  <div key={i} style={styles.paragraph}>{line}</div>
                ) : (
                  <p key={i} style={styles.paragraph}>{line}</p>
                )
              ))}
            </div>
          </div>
        );
      })}

      <div style={styles.footer}>
        <div style={styles.footerTitle}>
          <Mail size={18} style={{ marginRight: 6, verticalAlign: 'middle' }} />
          ¿Necesitas más ayuda?
        </div>
        <p style={styles.footerText}>
          Escríbenos a <strong>davisvacacela@gmail.com</strong> 
        </p>
        <p style={styles.footerText}>
          DAJHO v1.0.0 
        </p>
      </div>
    </div>
  );
};
