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

// ─── Clave en localStorage ───────────────────────────────
const RECIBOS_KEY = 'dajho_recibos';

// ─── Recibos ─────────────────────────────────────────────
export function getRecibos(): Recibo[] {
  try {
    const raw = localStorage.getItem(RECIBOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecibo(recibo: Recibo): void {
  const list = getRecibos();
  list.unshift(recibo); // más reciente primero
  localStorage.setItem(RECIBOS_KEY, JSON.stringify(list));
}

export function getReciboById(id: string): Recibo | undefined {
  return getRecibos().find((r) => r.id === id);
}

export function buscarRecibos(query: string): Recibo[] {
  const q = query.toLowerCase().trim();
  if (!q) return getRecibos();
  return getRecibos().filter(
    (r) =>
      r.cliente.toLowerCase().includes(q) ||
      r.numero.toLowerCase().includes(q) ||
      r.vendedor.toLowerCase().includes(q)
  );
}

// ─── Generar IDs / números ───────────────────────────────
export function generarNumeroRecibo(): string {
  const now = new Date();
  const año = now.getFullYear().toString().slice(-2);
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const dia = String(now.getDate()).padStart(2, '0');
  const correlativo = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `R${año}${mes}${dia}-${correlativo}`;
}

export function generarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
