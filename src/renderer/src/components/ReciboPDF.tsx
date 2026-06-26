import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Definir tipos
interface ProductoRecibo {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface ReciboData {
  numero: string;
  fecha: string;
  hora: string;
  cliente: string;
  productos: ProductoRecibo[];
  subtotal: number;
  iva: number;
  total: number;
  metodoPago: string;
  vendedor: string;
  negocio: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
    email: string;
  };
  piePagina: string;
}

// Estilos del PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    textAlign: 'center',
    marginBottom: 16,
    borderBottom: '1px solid #ccc',
    paddingBottom: 12,
  },
  negocioNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  negocioInfo: {
    fontSize: 9,
    color: '#555',
    marginBottom: 2,
  },
  reciboNumero: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 80,
  },
  infoValue: {
    flex: 1,
  },
  table: {
    marginVertical: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f4f9',
    padding: 6,
    fontWeight: 'bold',
    borderBottom: '1px solid #ccc',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1px solid #eee',
  },
  colProducto: {
    flex: 3,
  },
  colCantidad: {
    flex: 1,
    textAlign: 'center',
  },
  colPrecio: {
    flex: 1.5,
    textAlign: 'right',
  },
  colSubtotal: {
    flex: 1.5,
    textAlign: 'right',
  },
  totales: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #ccc',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  totalLabel: {
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
    marginRight: 8,
  },
  totalValue: {
    width: 80,
    textAlign: 'right',
  },
  totalFinal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: '1px solid #ccc',
    textAlign: 'center',
    fontSize: 9,
    color: '#888',
  },
  metodoPago: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8faff',
    borderRadius: 4,
    textAlign: 'center',
    fontSize: 10,
  },
});

export const ReciboPDF = ({ data }: { data: ReciboData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Text style={styles.negocioNombre}>{data.negocio.nombre}</Text>
        <Text style={styles.negocioInfo}>RUC: {data.negocio.ruc}</Text>
        <Text style={styles.negocioInfo}>{data.negocio.direccion}</Text>
        <Text style={styles.negocioInfo}>📞 {data.negocio.telefono} | ✉️ {data.negocio.email}</Text>
      </View>

      {/* Número de recibo */}
      <View style={styles.reciboNumero}>
        <Text>📋 RECIBO DE COMPRA #{data.numero}</Text>
      </View>

      {/* Información del cliente */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Cliente:</Text>
        <Text style={styles.infoValue}>{data.cliente || 'Consumidor Final'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Fecha:</Text>
        <Text style={styles.infoValue}>{data.fecha} - {data.hora}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Vendedor:</Text>
        <Text style={styles.infoValue}>{data.vendedor}</Text>
      </View>

      {/* Tabla de productos */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colProducto}>Producto</Text>
          <Text style={styles.colCantidad}>Cant.</Text>
          <Text style={styles.colPrecio}>Precio</Text>
          <Text style={styles.colSubtotal}>Subtotal</Text>
        </View>
        {data.productos.map((producto, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colProducto}>{producto.name}</Text>
            <Text style={styles.colCantidad}>{producto.quantity}</Text>
            <Text style={styles.colPrecio}>${producto.price.toFixed(2)}</Text>
            <Text style={styles.colSubtotal}>${producto.subtotal.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totales */}
      <View style={styles.totales}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>${data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>IVA ({data.iva > 0 ? '12%' : '0%'}):</Text>
          <Text style={styles.totalValue}>${(data.total - data.subtotal).toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, styles.totalFinal]}>TOTAL:</Text>
          <Text style={[styles.totalValue, styles.totalFinal]}>${data.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Método de pago */}
      <View style={styles.metodoPago}>
        <Text>💳 Método de pago: {data.metodoPago}</Text>
      </View>

      {/* Pie de página */}
      <View style={styles.footer}>
        <Text>{data.piePagina}</Text>
        <Text style={{ marginTop: 4, fontSize: 8 }}>¡Gracias por tu compra! 💕</Text>
      </View>
    </Page>
  </Document>
);