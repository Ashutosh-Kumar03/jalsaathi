// Chhote, saaf line-icons (emoji ki jagah). Rang apne aap aas-paas ke text ka lete hain.

const PATHS = {
    drop: <path d="M12 2.7s6.5 6.6 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 9.3 12 2.7 12 2.7z" />,
    rain: (
      <>
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <path d="M16 14v6" />
        <path d="M8 14v6" />
        <path d="M12 16v6" />
      </>
    ),
    ok: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    home: (
      <>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    rupee: (
      <>
        <path d="M6 3h12" />
        <path d="M6 8h12" />
        <path d="m6 13 8.5 8" />
        <path d="M6 13h3" />
        <path d="M9 13c6.667 0 6.667-10 0-10" />
      </>
    ),
    bell: (
      <>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </>
    ),
    sprout: (
      <>
        <path d="M7 20h10" />
        <path d="M10 20c5.5-2.5.8-6.4 3-10" />
        <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
        <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    volume: (
      <>
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </>
    ),
    stop: <rect x="6" y="6" width="12" height="12" rx="1.5" />,
    offline: (
      <>
        <path d="M12 20h.01" />
        <path d="M8.5 16.429a5 5 0 0 1 7 0" />
        <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />
        <path d="M19 12.859a10 10 0 0 0-2.007-1.523" />
        <path d="M2 8.82a15 15 0 0 1 4.177-2.643" />
        <path d="M22 8.82a15 15 0 0 0-11.288-3.764" />
        <path d="m2 2 20 20" />
      </>
    ),
  };
  
  export default function Icon({ name, size = 20, style }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ verticalAlign: '-0.2em', flexShrink: 0, ...style }}
      >
        {PATHS[name]}
      </svg>
    );
  }