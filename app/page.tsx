export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", margin: "2rem auto", maxWidth: 640 }}>
      <h1>pr-axis KB API</h1>
      <p>
        Knowledge base API for the Ask Marcus chatbot on pr-axisdev.com.
        Reads are public. Writes need the X-KB-Key header.
      </p>
      <ul>
        <li>
          <a href="/api/health">GET /api/health</a>
        </li>
        <li>
          <a href="/api/kb">GET /api/kb</a> (optional ?topic= and ?q=)
        </li>
        <li>GET /api/kb/:id</li>
        <li>POST /api/kb (X-KB-Key header)</li>
        <li>DELETE /api/kb/:id (X-KB-Key header)</li>
      </ul>
      <p>
        Source:{" "}
        <a href="https://github.com/matanguihanbenson/pr-axis-kb-api">
          matanguihanbenson/pr-axis-kb-api
        </a>
      </p>
    </main>
  );
}
