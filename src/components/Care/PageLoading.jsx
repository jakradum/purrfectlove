export default function PageLoading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minHeight: '40vh',
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: '3px solid rgba(44, 95, 79, 0.15)',
        borderTopColor: '#2C5F4F',
        borderRadius: '50%',
        animation: 'pl-spin 0.75s linear infinite',
      }} />
      <style>{`
        @keyframes pl-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
