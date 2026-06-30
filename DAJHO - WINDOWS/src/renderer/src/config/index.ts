/**
 * Cargador de configuración según DAJHO_TYPE
 * 
 * Usa el valor de:
 * 1. Variable global __DAJHO_TYPE__ (inyectada por Vite)
 * 2. Query param ?type=ropa en la URL
 * 3. Nombre del ejecutable
 * 4. Default 'tienda'
 */

import type { BusinessConfig, BusinessType } from './types';
import tiendaConfig from './tienda';
import ropaConfig from './ropa';
import ferreteriaConfig from './ferreteria';

const configMap: Record<string, BusinessConfig> = {
  tienda: tiendaConfig,
  ropa: ropaConfig,
  ferreteria: ferreteriaConfig,
};

let cachedConfig: BusinessConfig | null = null;

declare const __DAJHO_TYPE__: string | undefined;

/**
 * Determina el tipo de negocio
 */
function detectBusinessType(): BusinessType {
  // 1. Variable global de Vite (dev mode)
  if (typeof __DAJHO_TYPE__ !== 'undefined' && __DAJHO_TYPE__ in configMap) {
    return __DAJHO_TYPE__ as BusinessType;
  }

  // 2. Query param en URL
  try {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type');
    if (typeParam && typeParam in configMap) return typeParam as BusinessType;
  } catch {}

  // 3. Nombre del ejecutable (producción)
  try {
    const path = window.location.href;
    if (path.includes('tienda') || path.includes('Tienda')) return 'tienda';
    if (path.includes('ropa') || path.includes('Ropa')) return 'ropa';
    if (path.includes('ferreteria') || path.includes('Ferreteria')) return 'ferreteria';
  } catch {}

  // 4. Default
  return 'tienda';
}

/**
 * Obtiene la configuración activa del negocio
 */
export function getBusinessConfig(): BusinessConfig {
  if (cachedConfig) return cachedConfig;

  const type = detectBusinessType();
  cachedConfig = configMap[type] || tiendaConfig;
  return cachedConfig;
}

/**
 * Obtiene el tipo de negocio activo
 */
export function getBusinessType(): BusinessType {
  return detectBusinessType();
}

export { type BusinessConfig, type BusinessType, type BusinessFeatures } from './types';
