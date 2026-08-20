// The page shown behind (and after a failed/cancelled attempt at) the browser's native Basic
// Auth dialog — see middleware.ts. Kept in its own module, as a plain string, rather than inline
// in middleware.ts: middleware.ts runs in the Edge runtime, which bundles everything into one
// snippet with no filesystem access, so an actual .html file can't be read at request time — this
// is the closest equivalent, a self-contained document with no external CSS/font/image requests.
//
// Styled to match src/components/ui/ApiErrorPage.tsx (the same full-screen takeover shown when
// the TMDB proxy is unreachable) — same logo, radial gradient, icon/heading/message/button
// structure — hand-written in plain CSS since this doesn't go through Tailwind.
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 1.5rem;
    background: #050505;
    background-image: radial-gradient(circle at 50% 32%, rgba(229, 9, 20, 0.14), transparent 60%);
    color: #f5f5f5;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    text-align: center;
  }
  .logo {
    width: 4rem;
    height: 4rem;
    margin: 0 0 1.5rem;
    display: block;
  }
  .icon {
    width: 2.5rem;
    height: 2.5rem;
    margin: 0 0 1.25rem;
    color: #a0a0a0;
    opacity: 0.5;
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
  }
  .message {
    color: #a0a0a0;
    font-size: 0.95rem;
    line-height: 1.6;
    margin: 0.75rem 0 0;
    max-width: 24rem;
  }
  .retry {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 2rem;
    padding: 0.75rem 1.5rem;
    background: #fff;
    color: #000;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
    border-radius: 0.25rem;
    transition: transform 0.15s ease;
  }
  .retry:hover { transform: scale(1.05); }
  .retry:active { transform: scale(0.95); }
  .retry svg { width: 1rem; height: 1rem; }
</style>
</head>
<body>
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

  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>

  <h1>Site is private</h1>
  <p class="message">This site is private. Enter your credentials when prompted to continue.</p>

  <a class="retry" href="/">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
    Try again
  </a>
</body>
</html>`;
