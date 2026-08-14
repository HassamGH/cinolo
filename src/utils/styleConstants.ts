// Cinematic bottom+left dark gradient laid over backdrop images, expressed as a
// Tailwind arbitrary background-image value (kept as one shared constant so
// Hero and DetailHeader don't duplicate the literal). The bottom stop holds
// flat at the page background color for longer so the image blends into the
// content below it instead of cutting off at a hard edge.
export const BACKDROP_GRADIENT_CLASS =
  "bg-[linear-gradient(to_top,#050505_0%,#050505_10%,rgba(5,5,5,0.92)_25%,rgba(5,5,5,0.55)_50%,rgba(5,5,5,0.15)_75%,transparent_100%),linear-gradient(to_right,rgba(5,5,5,0.9)_0%,rgba(5,5,5,0.35)_45%,transparent_75%)]"
