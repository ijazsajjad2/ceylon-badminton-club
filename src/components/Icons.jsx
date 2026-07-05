// Consistent line-icon set for navigation — replaces emoji, which render
// differently on every phone. All icons share one 24×24 grid, stroke-based,
// and inherit color from the surrounding text (currentColor).

const PATHS = {
  home: (
    <>
      <path d="M3.5 10.8 12 3.8l8.5 7" />
      <path d="M5.5 9.5V20h4.6v-5.4h3.8V20h4.6V9.5" />
    </>
  ),
  shuffle: (
    <>
      <path d="M3 7h3.2c1.6 0 3 .8 3.9 2.1l3.8 5.8a4.7 4.7 0 0 0 3.9 2.1H21" />
      <path d="M3 17h3.2c1.6 0 3-.8 3.9-2.1l.6-.9" />
      <path d="M13.3 9.1l.6-.9A4.7 4.7 0 0 1 17.8 7H21" />
      <path d="m18.5 4.5 2.5 2.5-2.5 2.5" />
      <path d="m18.5 14.5 2.5 2.5-2.5 2.5" />
    </>
  ),
  shuttle: (
    <>
      <circle cx="12" cy="18.2" r="2.6" />
      <path d="M9.8 16.6 5.5 6.5 8 5l4 7.6L16 5l2.5 1.5-4.3 10.1" />
      <path d="M12 12.6V15" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5.5a5 5 0 0 1-10 0Z" />
      <path d="M7 5.5H4.2v1.2A3.3 3.3 0 0 0 7.5 10M17 5.5h2.8v1.2A3.3 3.3 0 0 1 16.5 10" />
      <path d="M12 14.5V17M8.8 20h6.4M10 17h4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.8h17M8 3v3.4M16 3v3.4" />
      <path d="M8 14h3" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.2" r="3.4" />
      <path d="M3.2 20a5.8 5.8 0 0 1 11.6 0" />
      <path d="M15.4 5.2a3.4 3.4 0 0 1 0 6.1" />
      <path d="M17.2 14.6a5.8 5.8 0 0 1 3.6 5.4" />
    </>
  ),
  film: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9h17M8.2 4.5 10.5 9M13 4.5 15.3 9M3.5 15.5h17" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.6-5.5-6.6-10.5a6.6 6.6 0 0 1 13.2 0C18.6 15.5 12 21 12 21Z" />
      <circle cx="12" cy="10.3" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.4V12l3.1 2" />
    </>
  ),
  moon: <path d="M20 13.4A8 8 0 1 1 10.6 4a6.5 6.5 0 0 0 9.4 9.4Z" />,
  sunrise: (
    <>
      <path d="M4 18.2h16" />
      <path d="M7.6 14.8a4.4 4.4 0 0 1 8.8 0" />
      <path d="M12 7V3.8M6 9.4 4.2 7.6M18 9.4l1.8-1.8" />
    </>
  ),
  chat: (
    <>
      <path d="M12 4.2a7.9 7.9 0 0 1 6.8 11.9l1 3.7-3.8-1A7.9 7.9 0 1 1 12 4.2Z" />
      <path d="M9 10.6h6M9 13.4h3.6" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.3 8.7-1.9 4.6-4.7 2 2-4.7Z" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="3.7" />
      <path d="m10.7 12.3 8.3-8.3M15.5 7.5l2.9 2.9M13 10l2.2 2.2" />
    </>
  ),
  camera: (
    <>
      <rect x="3.5" y="7" width="17" height="13" rx="2.5" />
      <path d="M8.5 7 10 4.5h4L15.5 7" />
      <circle cx="12" cy="13.2" r="3.3" />
    </>
  ),
  check: <path d="m5 12.8 4.3 4.2L19 7.4" />,
  hourglass: (
    <>
      <path d="M7 3.5h10M7 20.5h10" />
      <path d="M8.2 3.5v3a4 4 0 0 0 1.7 3.3l2.1 1.4 2.1-1.4A4 4 0 0 0 15.8 6.5v-3" />
      <path d="M8.2 20.5v-3a4 4 0 0 1 1.7-3.3l2.1-1.4 2.1 1.4a4 4 0 0 1 1.7 3.3v3" />
    </>
  ),
  court: (
    <>
      <rect x="3" y="6" width="18" height="12.5" rx="1.5" />
      <path d="M12 6v12.5M7.3 6v12.5M16.7 6v12.5" />
    </>
  ),
  flag: (
    <>
      <path d="M5.5 21V4" />
      <path d="M5.5 4.8h12.4l-2.5 3.6 2.5 3.6H5.5" />
    </>
  ),
}

export default function NavIcon({ name, size = 22, ...rest }) {
  const paths = PATHS[name]
  if (!paths) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths}
    </svg>
  )
}
