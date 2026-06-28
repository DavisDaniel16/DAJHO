// ─── Tipos ───────────────────────────────────────────────
export interface ProductoRecibo {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Recibo {
  id: string;
  numero: string;
  fecha: string;
  fechaRaw: string; // ISO para ordenar
  hora: string;
  cliente: string;
  productos: ProductoRecibo[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  vendedor: string;
  negocioNombre: string;
  negocioRuc: string;
}

// ─── Recibos (persistencia en SQLite vía IPC) ────────────
// Fallback a localStorage si el IPC no está disponible (desarrollo)

const RECIBOS_KEY = 'dajho_recibos';

async function getDB(): Promise<Window['dajhoAPI']['recibos'] | null> {
  try {
    if (window.dajhoAPI?.recibos) return window.dajhoAPI.recibos;
  } catch { /* ignore */ }
  return null;
}

// ─── Obtener todos los recibos ───────────────────────────
export async function getRecibos(): Promise<Recibo[]> {
  try {
    const db = await getDB();
    if (db) {
      return await db.getAll();
    }
  } catch { /* fallback */ }
  // Fallback a localStorage
  try {
    const raw = localStorage.getItem(RECIBOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// ─── Guardar un recibo ───────────────────────────────────
export async function saveRecibo(recibo: Recibo): Promise<void> {
  try {
    const db = await getDB();
    if (db) {
      await db.save(recibo);
      return;
    }
  } catch { /* fallback */ }
  // Fallback a localStorage
  try {
    const list: Recibo[] = JSON.parse(localStorage.getItem(RECIBOS_KEY) || '[]');
    list.unshift(recibo);
    localStorage.setItem(RECIBOS_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

// ─── Buscar recibos ─────────────────────────────────────
export async function buscarRecibos(query: string): Promise<Recibo[]> {
  try {
    const db = await getDB();
    if (db) {
      if (!query.trim()) return await db.getAll();
      return await db.search(query);
    }
  } catch { /* fallback */ }
  // Fallback a localStorage
  try {
    const raw = localStorage.getItem(RECIBOS_KEY);
    const list: Recibo[] = raw ? JSON.parse(raw) : [];
    if (!query.trim()) return list;
    const q = query.toLowerCase().trim();
    return list.filter(r =>
      r.cliente.toLowerCase().includes(q) ||
      r.numero.toLowerCase().includes(q) ||
      r.vendedor.toLowerCase().includes(q)
    );
  } catch { return []; }
}

// ─── Generar número secuencial RIMPE ─────────────────────
// Formato oficial SRI: 001-001-XXXXXX
// El contador se almacena en la BD (settings.recibo_secuencial = '0')
export async function generarNumeroRecibo(): Promise<string> {
  try {
    if (window.dajhoAPI?.recibos?.nextNumero) {
      const numero = await window.dajhoAPI.recibos.nextNumero();
      // Verificar que sea un string válido con el formato esperado
      if (typeof numero === 'string' && numero.startsWith('001-001-')) {
        return numero;
      }
    }
  } catch (err) {
    console.error('Error al obtener número secuencial:', err);
  }
  // Fallback seguro: timestamp si falla la BD
  const fallback = String(Date.now()).slice(-6);
  return `001-001-${fallback}`;
}

export function generarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
