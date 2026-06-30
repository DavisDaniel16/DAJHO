import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { textAlign: 'center', marginBottom: 16, borderBottom: '1px solid #ccc', paddingBottom: 12 },
  negocioNombre: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  negocioInfo: { fontSize: 9, color: '#555', marginBottom: 2 },
  reciboNumero: { fontSize: 12, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  infoLabel: { fontWeight: 'bold', width: 80 },
  infoValue: { flex: 1 },
  table: { marginVertical: 12 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f0f4f9', padding: 6, fontWeight: 'bold', borderBottom: '1px solid #ccc' },
  tableRow: { flexDirection: 'row', padding: 6, borderBottom: '1px solid #eee' },
  totales: { marginTop: 12, paddingTop: 12, borderTop: '1px solid #ccc' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  totalLabel: { fontWeight: 'bold', width: 100, textAlign: 'right', marginRight: 8 },
  totalValue: { width: 80, textAlign: 'right' },
  footer: { marginTop: 24, paddingTop: 12, borderTop: '1px solid #ccc', textAlign: 'center', fontSize: 9, color: '#888' },
  metodoPago: { marginTop: 8, padding: 8, backgroundColor: '#f8faff', borderRadius: 4, textAlign: 'center', fontSize: 10 },
});

export const ReciboPDF = ({ data }: { data: ReciboData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabecera del negocio */}
      <View style={styles.header}>
        <Text style={styles.negocioNombre}>{data.negocio.nombre}</Text>
        <Text style={styles.negocioInfo}>RUC: {data.negocio.ruc}</Text>
        <Text style={styles.negocioInfo}>{data.negocio.direccion}</Text>
        <Text style={styles.negocioInfo}>{data.negocio.telefono} | {data.negocio.email}</Text>
      </View>

      {/* Título */}
      <View style={styles.reciboNumero}>
        <Text>NOTA DE VENTA RIMPE #{data.numero}</Text>
      </View>

      {/* Fecha / Hora / Vendedor */}
      <View style={{ marginBottom: 12 }}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha:</Text>
          <Text style={{ ...styles.infoValue, textAlign: 'right' }}>{data.fecha}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hora:</Text>
          <Text style={{ ...styles.infoValue, textAlign: 'right' }}>{data.hora}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vendedor:</Text>
          <Text style={{ ...styles.infoValue, textAlign: 'right' }}>{data.vendedor}</Text>
        </View>
      </View>

      {/* Cliente */}
      <View style={{ marginBottom: 12, padding: 8, backgroundColor: '#f8faff', borderRadius: 4 }}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cliente:</Text>
          <Text style={styles.infoValue}>{data.cliente || 'Consumidor Final'}</Text>
        </View>
      </View>

      {/* Tabla de productos */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={{ flex: 1, textAlign: 'center', fontWeight: 'bold' }}>CANT</Text>
          <Text style={{ flex: 3, fontWeight: 'bold' }}>PRODUCTO</Text>
          <Text style={{ flex: 1.5, textAlign: 'right', fontWeight: 'bold' }}>PRECIO</Text>
          <Text style={{ flex: 1.5, textAlign: 'right', fontWeight: 'bold' }}>TOTAL</Text>
        </View>
        {data.productos.map((producto, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={{ flex: 1, textAlign: 'center' }}>{producto.quantity}</Text>
            <Text style={{ flex: 3 }}>{producto.name}</Text>
            <Text style={{ flex: 1.5, textAlign: 'right' }}>${producto.price.toFixed(2)}</Text>
            <Text style={{ flex: 1.5, textAlign: 'right' }}>${producto.subtotal.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totales */}
      <View style={styles.totales}>
        <View style={styles.totalRow}>
          <Text style={{ ...styles.totalLabel, width: 130 }}>Subtotal:</Text>
          <Text style={styles.totalValue}>${data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={{ ...styles.totalLabel, width: 130 }}>IVA (0%):</Text>
          <Text style={styles.totalValue}>$0.00</Text>
        </View>
      </View>

      <View style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', paddingVertical: 6, marginVertical: 8 }}>
        <View style={styles.totalRow}>
          <Text style={{ ...styles.totalLabel, width: 130, fontSize: 14, fontWeight: 'bold' }}>TOTAL A PAGAR:</Text>
          <Text style={{ ...styles.totalValue, fontSize: 14, fontWeight: 'bold' }}>${data.total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Método de pago */}
      <Text style={styles.metodoPago}>
        Método de pago: {data.metodoPago}
      </Text>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>{data.piePagina}</Text>
      </View>

      {/* Disclaimer */}
      <View style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid #ccc', textAlign: 'center', fontSize: 8, color: '#999' }}>
        <Text>Este documento es una NOTA DE VENTA</Text>
        <Text>No es un comprobante fiscal. Valor solo para el registro contable del negocio.</Text>
      </View>
    </Page>
  </Document>
);
