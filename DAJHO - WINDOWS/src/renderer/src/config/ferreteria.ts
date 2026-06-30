/**
 * Configuración para DAJHO Ferretería (1.F)
 * Especializado en ferretería: marcas, unidades de medida, proveedores
 */
import type { BusinessConfig } from './types';

const ferreteriaConfig: BusinessConfig = {
  code: 'F',
  name: 'Ferretería',
  fullName: 'DAJHO Ferretería',
  version: '1.0.0',

  theme: {
    primary: '#ea580c',      // Naranja
    secondary: '#ca8a04',    // Amarillo
    accent: '#16a34a',       // Verde
    logo: 'Hammer',
    sidebar: '#1c1917',
  },

  features: {
    inventory: {
      showSizes: false,
      showColors: false,
      showBrand: true,
      showUnitType: true,
      showBarcode: true,
      categories: [
        'Herramientas Manuales', 'Herramientas Eléctricas', 'Materiales',
        'Electricidad', 'Plomería', 'Pinturas', 'Ferretería General',
        'Seguridad Industrial', 'Jardinería', 'Tornillería',
      ],
    },
    sales: {
      showPaymentMethod: true,
      showClient: true,
      showDiscount: true,
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

export default ferreteriaConfig;
