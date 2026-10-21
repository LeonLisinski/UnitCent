/**
 * Oznake App Store / Google Play. Zasad ne vode nigdje: aplikacija još nije objavljena,
 * pa su neaktivni gumbi (aria-disabled), a ne poveznice. Kad izađe, zamijeniti u <a href="…">.
 */
function AppleMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.1 2.5-1.8 3.1-.5 7.6 1.3 10.1.8 1.2 1.8 2.6 3.1 2.5 1.3 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.4-3.7zM14 5.3c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 2.8c-.3.3-.5.8-.5 1.400v15.600c0 .6.2 1.100.5 1.400l8.600-9.200z" fill="#3dd6a3" />
      <path d="M15.500 15.100 12.600 12l2.900-3.100 3.700 2.100c1 .6 1 1.400 0 2z" fill="#f5c542" />
      <path d="M4 21.200c.3.300.8.400 1.400.1l10.100-6.200L12.600 12z" fill="#ef5b5b" />
      <path d="M4 2.800c.3-.3.8-.4 1.400-.1l10.100 6.200-2.900 3.100z" fill="#4c8df5" />
    </svg>
  );
}

export function Stores({ className = "" }: { className?: string }) {
  return (
    <div className={`stores ${className}`.trim()}>
      <button type="button" className="store" aria-disabled="true" aria-label="App Store, uskoro">
        <AppleMark />
        <strong>App Store</strong>
        <span className="store-soon">Uskoro</span>
      </button>
      <button type="button" className="store" aria-disabled="true" aria-label="Google Play, uskoro">
        <PlayMark />
        <strong>Google Play</strong>
        <span className="store-soon">Uskoro</span>
      </button>
    </div>
  );
}
