export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "1rem" }}>
            Page Not Found
          </h1>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/en" style={{ color: "#e62b1e", textDecoration: "underline" }}>
            Go to Homepage
          </a>
        </div>
      </body>
    </html>
  );
}
