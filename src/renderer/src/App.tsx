

function App() {
  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#2c3e50' }}>🚀 Nexo</h1>
      <p style={{ fontSize: '18px' }}>
        Bienvenido a tu sistema de gestión de escritorio.
      </p>
      <p style={{ color: '#7f8c8d' }}>
        Versión Electron corriendo con React + TypeScript.
      </p>
      <div style={{ marginTop: '20px', background: '#ecf0f1', padding: '20px', borderRadius: '8px' }}>
        <h3>Estado del sistema:</h3>
        <ul>
          <li>Plataforma: <strong>{window.nexoAPI?.platform || 'Desconocida'}</strong></li>
          <li>Electron: <strong>{window.nexoAPI?.version || 'N/A'}</strong></li>
        </ul>
      </div>
    </div>
  );
}

export default App;