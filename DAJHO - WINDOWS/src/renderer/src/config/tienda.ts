/**
 * Configuración para DAJHO Tienda (1.T)
 * Negocio general: cualquier tipo de tienda
 */
import type { BusinessConfig } from './types';

const tiendaConfig: BusinessConfig = {
  code: 'T',
  name: 'Tienda',
  fullName: 'DAJHO Tienda',
  version: '1.0.0',

  theme: {
    primary: '#2563eb',      // Azul
    secondary: '#7c3aed',    // Púrpura
    accent: '#059669',       // Verde
    logo: 'Store',
    sidebar: '#1e293b',
  },

  features: {
    inventory: {
      showSizes: false,
      showColors: false,
      showBrand: false,
      showUnitType: false,
      showBarcode: true,
      categories: [
        'General', 'Electrónicos', 'Hogar', 'Juguetes',
        'Deportes', 'Libros', 'Belleza', 'Alimentos',
      ],
    },
    sales: {
      showPaymentMethod: true,
      showClient: true,
      showDiscount: false,
    },
    clients: {
      showDebt: true,
      showPurchases: true,
    },
    dashboard: {
      showLowStock: true,
      showTopProducts: true,
    },
  },

  defaultSettings: {
    iva_porcentaje: '12',
    app_language: 'es',
    recibo_secuencial: '0',
  },
};

export default tiendaConfig;
