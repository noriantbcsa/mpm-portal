"use client";

// Último recurso: reemplaza al layout raíz si este mismo falla (p. ej. la
// base de datos no responde al leer los ajustes del sitio). No hereda los
// estilos globales, así que lleva estilos mínimos en línea.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#faf9f6",
          color: "#1a1a1a",
          padding: "16px",
          textAlign: "center",
        }}
      >
        <title>Algo salió mal · MPM</title>
        <main>
          <h1 style={{ fontSize: "1.5rem" }}>No pudimos cargar el portal</h1>
          <p style={{ maxWidth: "28rem", color: "#555" }}>
            Intenta de nuevo en unos segundos. Si el problema sigue, escríbenos por WhatsApp.
          </p>
          {error.digest && <p style={{ fontSize: "0.75rem", color: "#888" }}>Código: {error.digest}</p>}
          <button
            type="button"
            onClick={retry}
            style={{
              marginTop: "8px",
              padding: "12px 24px",
              borderRadius: "999px",
              border: "none",
              background: "#1a1a1a",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Intentar de nuevo
          </button>
        </main>
      </body>
    </html>
  );
}
