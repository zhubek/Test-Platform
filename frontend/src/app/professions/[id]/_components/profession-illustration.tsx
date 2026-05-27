/**
 * Decorative SVG illustrations for profession detail headers.
 * Each illustration is a lightweight inline SVG themed to the profession.
 */

function DataScienceIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background grid */}
      <line x1="30" y1="130" x2="180" y2="130" stroke="#e5e7eb" strokeWidth="1" />
      <line x1="30" y1="100" x2="180" y2="100" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 3" />
      <line x1="30" y1="70" x2="180" y2="70" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 3" />
      <line x1="30" y1="40" x2="180" y2="40" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4 3" />

      {/* Bar chart */}
      <rect x="40" y="90" width="16" height="40" rx="3" fill="#bfdbfe" />
      <rect x="62" y="65" width="16" height="65" rx="3" fill="#93c5fd" />
      <rect x="84" y="50" width="16" height="80" rx="3" fill="#60a5fa" />
      <rect x="106" y="75" width="16" height="55" rx="3" fill="#93c5fd" />
      <rect x="128" y="45" width="16" height="85" rx="3" fill="#3b82f6" />
      <rect x="150" y="30" width="16" height="100" rx="3" fill="#2563eb" />

      {/* Trend line */}
      <polyline
        points="48,82 70,58 92,42 114,68 136,38 158,24"
        stroke="#7c3aed"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Data points on trend line */}
      <circle cx="48" cy="82" r="3.5" fill="#7c3aed" />
      <circle cx="70" cy="58" r="3.5" fill="#7c3aed" />
      <circle cx="92" cy="42" r="3.5" fill="#7c3aed" />
      <circle cx="114" cy="68" r="3.5" fill="#7c3aed" />
      <circle cx="136" cy="38" r="3.5" fill="#7c3aed" />
      <circle cx="158" cy="24" r="3.5" fill="#7c3aed" />

      {/* Scatter dots (background decoration) */}
      <circle cx="55" cy="112" r="2" fill="#c4b5fd" opacity="0.5" />
      <circle cx="77" cy="95" r="2" fill="#c4b5fd" opacity="0.5" />
      <circle cx="120" cy="105" r="2" fill="#c4b5fd" opacity="0.5" />
      <circle cx="145" cy="88" r="2" fill="#c4b5fd" opacity="0.5" />
      <circle cx="165" cy="110" r="2" fill="#c4b5fd" opacity="0.4" />

      {/* Neural network nodes (top-right decoration) */}
      <circle cx="172" cy="14" r="4" fill="#ddd6fe" />
      <circle cx="188" cy="8" r="3" fill="#ede9fe" />
      <circle cx="185" cy="24" r="3" fill="#ede9fe" />
      <line x1="172" y1="14" x2="188" y2="8" stroke="#ddd6fe" strokeWidth="1" />
      <line x1="172" y1="14" x2="185" y2="24" stroke="#ddd6fe" strokeWidth="1" />
    </svg>
  );
}

const illustrations: Record<string, React.FC<{ className?: string }>> = {
  "Data Scientist": DataScienceIllustration,
};

export function ProfessionIllustration({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const Illustration = illustrations[title];
  if (!Illustration) return null;
  return <Illustration className={className} />;
}
