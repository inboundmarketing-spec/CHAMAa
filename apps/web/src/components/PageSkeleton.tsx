export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando página">
      <div
        className="skeleton-bar"
        style={{
          height: 32,
          width: 220,
          marginBottom: '1.5rem',
        }}
      />
      <div
        className="card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton-bar"
            style={{
              height: 20,
              opacity: 0.5 + i * 0.15,
            }}
          />
        ))}
      </div>
    </div>
  );
}
