import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { applyThemeToStyles } from '../styles/theme';
import { useSales } from '../hooks/useDB';
import { FileDown, BarChart3, Calendar, DollarSign, TrendingUp, Package, Trophy, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

// Componente para barras de progreso
const ProgressBar = ({ value, max, color, label }: { value: number; max: number; color: string; label?: string }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={baseStyles.progressContainer}>
      {label && <span style={baseStyles.progressLabel}>{label}</span>}
      <div style={baseStyles.progressBar}>
        <div
          style={{
            ...baseStyles.progressFill,
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span style={baseStyles.progressValue}>{value}</span>
    </div>
  );
};

export const Statistics = () => {
  const { colors } = useTheme();
  const isDark = useMemo(() => {
    // Detectar si el tema es oscuro comparando colores clave
    return colors.bgPrimary === '#0f1729';
  }, [colors]);
  const themedStyles = applyThemeToStyles(baseStyles, colors, isDark);
  const styles: Record<string, React.CSSProperties> = {
    ...themedStyles,
  };
  const { sales } = useSales();
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
  const [selectedMetric, setSelectedMetric] = useState<'ventas' | 'ganancia'>('ventas');

  const salesData = useMemo(() => {
    const now = new Date();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Datos semanales
    const weekData: { day: string; ventas: number; ganancia: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySales = sales.filter((s: any) => s.date === dateStr);
      const total = daySales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
      weekData.push({ day: dayNames[d.getDay()], ventas: total, ganancia: total * 0.3 });
    }

    // Datos mensuales
    const monthData: { month: string; ventas: number; ganancia: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthSales = sales.filter((s: any) => {
        const sd = new Date(s.date);
        return sd.getFullYear() === year && sd.getMonth() === month;
      });
      const total = monthSales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
      monthData.push({ month: monthNames[month], ventas: total, ganancia: total * 0.3 });
    }

    return { weekData, monthData };
  }, [sales]);

  const currentData = timeRange === 'week' ? salesData.weekData : salesData.monthData;
  const labels = timeRange === 'week'
    ? salesData.weekData.map(d => d.day)
    : salesData.monthData.map(d => d.month);

  const totalVentasPeriodo = currentData.reduce((sum, d) => sum + d.ventas, 0);
  const totalGananciaPeriodo = currentData.reduce((sum, d) => sum + d.ganancia, 0);
  const promedio = totalVentasPeriodo / (currentData.length || 1);
  const maxValue = Math.max(...currentData.map(d => d.ventas), 1);

  // Comparación con período anterior
  const prevData = timeRange === 'week'
    ? salesData.weekData
    : salesData.monthData;
  const prevTotal = prevData.reduce((sum, d) => sum + d.ventas, 0);
  const ventasDiff = totalVentasPeriodo - prevTotal;
  const ventasPercent = prevTotal > 0 ? (ventasDiff / prevTotal) * 100 : 0;
  const gananciaDiff = totalGananciaPeriodo - (prevTotal * 0.3);
  const gananciaPercent = (prevTotal * 0.3) > 0 ? (gananciaDiff / (prevTotal * 0.3)) * 100 : 0;

  // Top productos (simulado desde ventas con items)
  const topProducts = useMemo(() => {
    const productCount: Record<string, { sales: number; revenue: number }> = {};
    sales.forEach((s: any) => {
      if (s.items) {
        s.items.forEach((item: any) => {
          const name = item.product_name || `Producto #${item.product_id}`;
          if (!productCount[name]) productCount[name] = { sales: 0, revenue: 0 };
          productCount[name].sales += item.quantity || 0;
          productCount[name].revenue += item.subtotal || 0;
        });
      }
    });
    return Object.entries(productCount)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [sales]);

  // Función para renderizar barras
  const renderBars = () => {
    return currentData.map((item, index) => {
      const value = selectedMetric === 'ventas' ? item.ventas : item.ganancia;
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      const color = selectedMetric === 'ventas' ? '#4a9eff' : '#2ecc71';
      
      return (
        <div key={index} style={styles.barGroup}>
          <div style={styles.barContainer}>
            <div
              style={{
                ...styles.bar,
                height: `${Math.max(percentage, 5)}%`,
                backgroundColor: color,
                opacity: 0.8,
              }}
            />
            <span style={styles.barValue}>${value}</span>
          </div>
          <span style={styles.barLabel}>{labels[index]}</span>
        </div>
      );
    });
  };

  // Exportar datos a Excel
  const exportToExcel = async () => {
    try {
      const now = new Date();
      const periodo = timeRange === 'week' ? 'Semanal' : 'Mensual';
      const fileName = `estadisticas-${periodo.toLowerCase()}-${now.toISOString().split('T')[0]}.xlsx`;

      const wsData = [
        [`Estadísticas ${periodo} - DAJHO`],
        [`Generado: ${now.toLocaleDateString('es-ES')}`],
        [],
        ['Período', 'Ventas ($)', 'Ganancia ($)'],
        ...currentData.map(d => [('day' in d ? d.day : d.month), d.ventas, d.ganancia]),
        [],
        ['TOTAL', totalVentasPeriodo, totalGananciaPeriodo],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Estadísticas');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      await window.dajhoAPI.file.saveDialog(fileName, buffer);
    } catch (err) {
      console.error('Error al exportar:', err);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}><BarChart3 size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Estadísticas</h1>

      {/* Controles */}
      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <button
            onClick={() => setTimeRange('week')}
            style={{
              ...styles.controlButton,
              ...(timeRange === 'week' ? styles.controlButtonActive : {}),
            }}
          >
            Semana
          </button>
          <button
            onClick={() => setTimeRange('month')}
            style={{
              ...styles.controlButton,
              ...(timeRange === 'month' ? styles.controlButtonActive : {}),
            }}
          >
            Mes
          </button>
        </div>
        <div style={styles.controlGroup}>
          <button
            onClick={() => setSelectedMetric('ventas')}
            style={{
              ...styles.controlButton,
              ...(selectedMetric === 'ventas' ? styles.controlButtonActive : {}),
            }}
          >
            Ventas
          </button>
          <button
            onClick={() => setSelectedMetric('ganancia')}
            style={{
              ...styles.controlButton,
              ...(selectedMetric === 'ganancia' ? styles.controlButtonActive : {}),
            }}
          >
            Ganancia
          </button>
        </div>
        <button
          onClick={exportToExcel}
          style={styles.exportButton}
          title="Exportar a Excel"
        >
          <FileDown size={18} style={{ marginRight: 6 }} /> Exportar datos
        </button>
      </div>

      {/* Resumen */}
      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <DollarSign size={24} color={colors.textSecondary} />
          <div>
            <div style={styles.summaryLabel}>Total ventas</div>
            <div style={styles.summaryValue}>${totalVentasPeriodo.toFixed(2)}</div>
            <div style={{
              ...styles.summaryDiff,
              color: ventasDiff >= 0 ? '#2ecc71' : '#e74c3c',
            }}>
              {ventasDiff >= 0 ? '↑' : '↓'} {Math.abs(ventasPercent).toFixed(1)}% vs período anterior
            </div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <TrendingUp size={24} color={colors.textSecondary} />
          <div>
            <div style={styles.summaryLabel}>Ganancia de ventas</div>
            <div style={styles.summaryValue}>${totalGananciaPeriodo.toFixed(2)}</div>
            <div style={{
              ...styles.summaryDiff,
              color: gananciaDiff >= 0 ? '#2ecc71' : '#e74c3c',
            }}>
              {gananciaDiff >= 0 ? '↑' : '↓'} {Math.abs(gananciaPercent).toFixed(1)}% vs período anterior
            </div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <BarChart3 size={24} color={colors.textSecondary} />
          <div>
            <div style={styles.summaryLabel}>Promedio {selectedMetric === 'ventas' ? 'ventas' : 'ganancia'}</div>
            <div style={styles.summaryValue}>
              ${promedio.toFixed(2)}
            </div>
            <div style={styles.summaryLabel}>por día</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <Package size={24} color={colors.textSecondary} />
          <div>
            <div style={styles.summaryLabel}>Productos más vendidos</div>
            {topProducts.length > 0 ? (
              <>
                <div style={styles.summaryValue}>{topProducts[0].name}</div>
                <div style={styles.summaryLabel}>{topProducts[0].sales} unidades</div>
              </>
            ) : (
              <div style={styles.summaryValue}>Sin datos</div>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div style={styles.chartContainer}>
        <h2 style={styles.chartTitle}>
          {selectedMetric === 'ventas' ? 'Ventas' : 'Ganancia'} - {timeRange === 'week' ? 'Semanal' : 'Mensual'}
        </h2>
        <div style={styles.chart}>
          {renderBars()}
        </div>
      </div>

      {/* Productos más vendidos */}
      <div style={styles.topProductsContainer}>
        <h2 style={styles.chartTitle}><Trophy size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Productos más vendidos</h2>
        <div style={styles.topProductsList}>
          {topProducts.map((product, index) => (
            <div key={index} style={styles.topProductItem}>
              <div style={styles.topProductRank}>
                <span style={styles.rankNumber}>#{index + 1}</span>
              </div>
              <div style={styles.topProductInfo}>
                <div style={styles.topProductName}>{product.name}</div>
                <div style={styles.topProductDetails}>
                  <span>{product.sales} unidades</span>
                  <span style={styles.topProductRevenue}>${product.revenue.toFixed(2)}</span>
                </div>
              </div>
              <div style={styles.topProductBarContainer}>
                <div
                  style={{
                    ...styles.topProductBar,
                    width: `${(product.sales / topProducts[0].sales) * 100}%`,
                    backgroundColor: ['#4a9eff', '#2ecc71', '#f39c12', '#e74c3c', '#8b5cf6'][index % 5],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detalle de ventas */}
      <div style={styles.detailContainer}>
        <h2 style={styles.chartTitle}><FileText size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Detalle de ventas</h2>
        <div style={styles.detailTable}>
          <div style={styles.detailRowHeader}>
            <span style={styles.detailCell}>{timeRange === 'week' ? 'Día' : 'Mes'}</span>
            <span style={styles.detailCell}>Ventas</span>
            <span style={styles.detailCell}>Ganancia</span>
            <span style={styles.detailCell}>Margen</span>
          </div>
          {currentData.map((item, index) => {
            const margin = item.ventas > 0 ? (item.ganancia / item.ventas) * 100 : 0;
            return (
              <div key={index} style={styles.detailRow}>
                <span style={styles.detailCell}>{labels[index]}</span>
                <span style={styles.detailCell}>${item.ventas.toFixed(2)}</span>
                <span style={styles.detailCell}>${item.ganancia.toFixed(2)}</span>
                <span style={styles.detailCell}>
                  <span style={styles.marginBadge}>{margin.toFixed(1)}%</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const baseStyles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '24px',
  },
  controls: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '24px',
  },
  controlGroup: {
    display: 'flex',
    gap: '8px',
  },
  controlButton: {
    padding: '8px 20px',
    backgroundColor: '#f0f4f9',
    border: '1px solid #d0d5dd',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#1a2332',
    transition: 'all 0.3s',
  },
  controlButtonActive: {
    backgroundColor: '#4a9eff',
    color: '#ffffff',
    borderColor: '#4a9eff',
  },
  exportButton: {
    padding: '10px 18px',
    backgroundColor: '#2ecc71',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap',
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  summaryIcon: {
    fontSize: '32px',
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#6b7a8a',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a2332',
  },
  summaryDiff: {
    fontSize: '13px',
    fontWeight: '500',
    marginTop: '4px',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
    marginBottom: '24px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1a2332',
    marginBottom: '20px',
  },
  chart: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '300px',
    padding: '0 10px',
  },
  barGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    height: '100%',
  },
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    width: '100%',
    paddingBottom: '8px',
  },
  bar: {
    width: '80%',
    minHeight: '4px',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.5s ease',
  },
  barValue: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#1a2332',
    marginTop: '4px',
  },
  barLabel: {
    fontSize: '12px',
    color: '#6b7a8a',
    fontWeight: '500',
  },
  topProductsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
    marginBottom: '24px',
  },
  topProductsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  topProductItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 16px',
    backgroundColor: '#f8faff',
    borderRadius: '8px',
    transition: 'background-color 0.3s',
  },
  topProductRank: {
    minWidth: '40px',
    textAlign: 'center',
  },
  rankNumber: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1a2332',
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#1a2332',
  },
  topProductDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#6b7a8a',
  },
  topProductRevenue: {
    fontWeight: '600',
    color: '#1a2332',
  },
  topProductBarContainer: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e0e4e8',
    borderRadius: '4px',
    overflow: 'hidden',
    minWidth: '100px',
  },
  topProductBar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  detailContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: '1px solid #e0e4e8',
  },
  detailTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  detailRowHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    padding: '12px 16px',
    backgroundColor: '#f8faff',
    borderRadius: '8px',
    fontWeight: '600',
    color: '#1a2332',
  },
  detailRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    padding: '10px 16px',
    borderBottom: '1px solid #f0f4f9',
    fontSize: '14px',
    color: '#1a2332',
  },
  detailCell: {
    display: 'flex',
    alignItems: 'center',
  },
  marginBadge: {
    padding: '2px 12px',
    borderRadius: '12px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: '13px',
    fontWeight: '500',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  progressLabel: {
    fontSize: '13px',
    color: '#1a2332',
    minWidth: '120px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e0e4e8',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.5s ease',
  },
  progressValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a2332',
    minWidth: '40px',
    textAlign: 'right',
  },
};

export default Statistics;