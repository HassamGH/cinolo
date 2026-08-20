// The page shown behind (and after a failed/cancelled attempt at) the browser's native Basic
// Auth dialog — see middleware.ts. Kept in its own module, as a plain string, rather than inline
// in middleware.ts: middleware.ts runs in the Edge runtime, which bundles everything into one
// snippet with no filesystem access, so an actual .html file can't be read at request time — this
// is the closest equivalent, a self-contained document with no external CSS/font/image requests.
export const UNAUTHORIZED_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Cinolo</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #050505;
    background-image: radial-gradient(circle at 50% 0%, rgba(229, 9, 20, 0.12), transparent 60%);
    color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  }
  .card {
    width: 100%;
    max-width: 22rem;
    margin: 1.5rem;
    padding: 2.5rem 2rem;
    text-align: center;
    background: #0f0f0f;
    border: 1px solid #232323;
    border-radius: 1rem;
  }
  .logo {
    width: 3.5rem;
    height: 3.5rem;
    margin: 0 auto 1.25rem;
    display: block;
    border-radius: 1rem;
  }
  .wordmark {
    font-size: 1.125rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    margin: 0 0 0.75rem;
  }
  .divider {
    width: 2rem;
    height: 2px;
    background: #e50914;
    border: none;
    margin: 0 auto 1rem;
  }
  .message {
    color: #9a9a9a;
    font-size: 0.9rem;
    line-height: 1.55;
    margin: 0 0 1.5rem;
  }
  .retry {
    display: inline-block;
    padding: 0.6rem 1.5rem;
    background: #e50914;
    color: #fff;
    font-size: 0.85rem;
    font-weight: 600;
    text-decoration: none;
    border-radius: 0.5rem;
  }
  .retry:hover { background: #c40812; }
</style>
</head>
<body>
  <div class="card">
    <svg class="logo" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#E50914" />
      <path
        d="M 23.5 12 A 8 8 0 1 0 20 24"
        fill="none"
        stroke="white"
        stroke-width="4.4"
        stroke-linecap="round"
      />
    </svg>
    <p class="wordmark">CINOLO</p>
    <hr class="divider" />
    <p class="message">This site is private. Enter your credentials when prompted to continue.</p>
    <a class="retry" href="/">Try again</a>
  </div>
</body>
</html>`;
