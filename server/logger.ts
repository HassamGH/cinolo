const RED = '\x1b[31m'
const RESET = '\x1b[0m'

interface RequestErrorInfo {
  method: string
  path: string
  status: number
  durationMs: number
  tag: string
}

// Every proxy failure (timeout, upstream error, bad response) goes through
// here instead of a bare console.error(err) dump, so logs are grep-able and
// consistent between the local Express server and the Vercel function:
//   ERROR GET /api/tmdb/search/multi?query=batman 504 in 8.1s [TIMEOUT]
// ERROR, the status code, and the [TAG] are colored red; the rest stays
// plain so the line is still readable if ANSI codes aren't rendered.
export function logRequestError({ method, path, status, durationMs, tag }: RequestErrorInfo): void {
  const seconds = (durationMs / 1000).toFixed(1)
  console.error(
    `${RED}ERROR${RESET} ${method} ${path} ${RED}${status}${RESET} in ${seconds}s ${RED}[${tag}]${RESET}`
  )
}
