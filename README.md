# Zeno

A cinematic, single-page movies & TV streaming interface. Metadata (search,
details, cast, seasons, episodes, recommendations, artwork) comes from
**TMDB**; actual video playback comes from **Vidcore.io**, which resolves a
real stream from a TMDB id with no API key required.

> Vidcore has no search/metadata API of its own — it's a video resolver
> keyed by TMDB id (`vidcore.io/movie/{tmdbId}`,
> `vidcore.io/tv/{tmdbId}/{season}/{episode}` — no `/embed/` prefix, no query
> parameters recognized). TMDB supplies everything else, which is why the app
> talks to both. Vidcore ships its own complete player UI (play/pause,
> progress, volume, fullscreen, quality, subtitles, its own "Next Episode")
> inside that page — Zeno adds no chrome of its own on top of it. Its player
> also actively refuses to run inside a sandboxed iframe, so the embed is
> intentionally left unsandboxed; a working player takes priority over
> defending against a hijacked-redirect edge case sandboxing would prevent.

## Architecture

```
src/
  services/
    tmdbClient.ts     fetch wrapper + in-memory cache, talks to /api/tmdb/*
    tmdb.ts            searchMoviesAndSeries, getMovieDetails, getSeriesDetails,
                        getSeriesSeasons, getEpisodes, getCast,
                        getRecommendedFor, imageUrl, ...
    tmdbRaw.ts         minimal typed shapes for the TMDB fields Zeno reads
    vidcore.ts         getVideoSource(source) -> Vidcore watch-page URL
  context/
    NavigationContext.tsx   SPA view-state stack, synced to the URL and
                             window.history (see Routing below)
    LoadingBarContext.tsx   global start()/stop() counter driving the
                             top-of-page loading bar
  hooks/
    useAsyncData.ts    data-fetch lifecycle (loading/error/data)
    usePlayMedia.ts    "press play" logic — movies play immediately, series
                        resolve season 1 / episode 1 on demand
    useDebouncedValue, useEscapeKey, useLockBodyScroll
  components/
    Header, Hero, ContentRow, MediaCard, SearchModal, SearchResultItem,
    MovieDetail, SeriesDetail, DetailHeader, SeasonSelector, EpisodeList,
    CastList, SimilarSection ("You may like"), VideoPlayer
    ui/  Dropdown, TopLoadingBar, Skeletons, Placeholder, RatingBadge, ZenoMark
  utils/
    format.ts           runtime/rating/meta-line formatting
    styleConstants.ts    shared Tailwind arbitrary-value strings (e.g. the
                          backdrop gradient), so components don't duplicate
                          long class literals
server/
  index.ts             Express proxy — the only thing that sees TMDB_API_KEY
```

Everything is one page. Search, movie/series detail, seasons, episodes, and
the player are all overlays/screens driven by `NavigationContext`.

**Styling:** there is no separate stylesheet of custom classes — `index.css`
holds only the Tailwind import and the `@theme` design tokens (colors, font)
that `bg-accent`, `text-muted`, etc. are built from. Everything else is
inline Tailwind utilities, including one-off effects (fade masks, gradients,
hidden/styled scrollbars) expressed via Tailwind's arbitrary-value syntax
directly in `className`.

**Loading state:** a single red bar at the top of the page (`TopLoadingBar`,
driven by `LoadingBarContext`) is the one loading indicator in the app —
there are no spinners anywhere. It activates on the home page's initial
fetch, on movie/series detail loads, on "play" resolving a series' first
episode, and on search.

## Routing / reload behavior

`NavigationContext` reflects the current screen in the URL (`/`,
`/movie/{id}`, `/series/{id}`) via `history.pushState`/`replaceState`, and
reads it back on mount. That means:

- A hard reload on a movie/series page lands back on that same page, not
  Home (it restores the detail view, not mid-video playback — there's no way
  to resume an iframe's internal player state across a reload).
- The browser back/forward buttons walk through Home → Search → Detail
  exactly like an in-app back button would.
- Search-open and player-open state aren't part of the URL, only the
  underlying screen is — closing over a search/player and reloading just
  drops those overlays, which is expected.

In dev, Vite's default SPA fallback serves `index.html` for any path, so
`/movie/123` resolves correctly. In production, whatever host serves the
built `dist/` needs an equivalent SPA rewrite (e.g. Netlify `_redirects`,
Vercel rewrites, nginx `try_files`) or deep links will 404.

## Setup

1. Get a free TMDB API key (v3 auth) at
   https://www.themoviedb.org/settings/api
2. Copy the env template and add your key:
   ```
   cp .env.example .env
   ```
   Edit `.env` and set `TMDB_API_KEY`. It's read only by `server/index.ts`
   and is never sent to the browser — the frontend calls `/api/tmdb/*` on
   the same origin, which Vite proxies to the local Express server.
3. Install and run:
   ```
   npm install
   npm run dev
   ```
   This starts the Vite dev server and the TMDB proxy together. Open the
   printed localhost URL.

`VITE_VIDCORE_BASE_URL` and `PORT` are also configurable in `.env` — see
`.env.example` for what each does. Changing `VITE_VIDCORE_BASE_URL` requires
restarting the Vite dev server (client env vars are baked in at startup).

## Scripts

- `npm run dev` — client (Vite) + server (Express/tsx) together
- `npm run build` — type-check and build the client for production
- `npm run preview` — preview the production build

## Deploying

The frontend is static once built (`npm run build` → `dist/`). The TMDB
proxy in `server/index.ts` needs to run somewhere with `TMDB_API_KEY` set as
a real environment variable (a small Node host, or adapt the single
`/api/tmdb/*splat` handler into a serverless function). Point your host's
`/api` routing at it the same way `vite.config.ts` does in dev, and make sure
its routing falls back to `index.html` for unknown paths (see Routing above).
