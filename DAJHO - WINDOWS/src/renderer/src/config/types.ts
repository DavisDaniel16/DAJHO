/**
 * Tipos para la configuración de negocio
 */

export interface BusinessTheme {
  primary: string;
  secondary: string;
  accent: string;
  logo: string;
  sidebar: string;
}

export interface InventoryFeatures {
  showSizes: boolean;
  showColors: boolean;
  showBrand: boolean;
  showUnitType: boolean;
  showBarcode: boolean;
  categories: string[];
}

export interface SalesFeatures {
  showPaymentMethod: boolean;
  showClient: boolean;
  showDiscount: boolean;
}

export interface ClientFeatures {
  showDebt: boolean;
  showPurchases: boolean;
}

export interface DashboardFeatures {
  showLowStock: boolean;
  showTopProducts: boolean;
}

export interface BusinessFeatures {
  inventory: InventoryFeatures;
  sales: SalesFeatures;
  clients: ClientFeatures;
  dashboard: DashboardFeatures;
}

export interface BusinessConfig {
  code: string;
  name: string;
  fullName: string;
  version: string;
  theme: BusinessTheme;
  features: BusinessFeatures;
  defaultSettings: Record<string, string>;
}

export type BusinessType = 'tienda' | 'ropa' | 'ferreteria';
