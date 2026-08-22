// Deterrent only against casual inspection of stream sources — not a real
// barrier, since DevTools can still be reopened via the browser's own menu
// or with JS disabled. Blocks right-click and common DevTools shortcuts.
export function disableInspect() {
  const blockContextMenu = (event: MouseEvent) => event.preventDefault()

  const blockDevToolsKeys = (event: KeyboardEvent) => {
    const key = event.key.toUpperCase()
    const isDevToolsShortcut =
      key === 'F12' ||
      (event.ctrlKey && event.shiftKey && (key === 'I' || key === 'J' || key === 'C')) ||
      (event.ctrlKey && key === 'U')

    if (isDevToolsShortcut) event.preventDefault()
  }

  document.addEventListener('contextmenu', blockContextMenu)
  document.addEventListener('keydown', blockDevToolsKeys)
}
