/**
 * Configuración para DAJHO Ropa (1.R)
 * Especializado en prendas de vestir: tallas, colores, temporadas
 */
import type { BusinessConfig } from './types';

const ropaConfig: BusinessConfig = {
  code: 'R',
  name: 'Ropa',
  fullName: 'DAJHO Ropa',
  version: '1.0.0',

  theme: {
    primary: '#db2777',      // Rosa
    secondary: '#9333ea',    // Púrpura
    accent: '#f59e0b',       // Ámbar
    logo: 'Shirt',
    sidebar: '#1e1b4b',
  },

  features: {
    inventory: {
      showSizes: true,
      showColors: true,
      showBrand: true,
      showUnitType: false,
      showBarcode: true,
      categories: [
        'Camisas', 'Pantalones', 'Zapatos', 'Accesorios',
        'Polos', 'Chaquetas', 'Vestidos', 'Ropa Interior',
        'Jeans', 'Shorts', 'Abrigos', 'Trajes',
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

export default ropaConfig;
