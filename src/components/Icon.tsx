export type IconName =
  | "speaker"
  | "back"
  | "close"
  | "arrow"
  | "check"
  | "fruit"
  | "user"
  | "eye"
  | "keys"
  | "lines"
  | "erase"
  | "hint"
  | "shift"
  | "enter"
  | "ear";

const PATHS: Record<IconName, React.ReactNode> = {
  speaker: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  back: <path d="M15 18l-6-6 6-6" />,
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  // 覚える: a fruit on its stem (言の実).
  fruit: (
    <>
      <circle cx="12" cy="14.5" r="6.5" />
      <path d="M12 8V4.5" />
      <path d="M12 6.2c1.4-2.3 3.6-3 6-2.6-.6 2.4-2.8 3.7-6 2.6z" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  keys: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="M6.5 10h1M10.5 10h1M14.5 10h1M8 14h8" />
    </>
  ),
  lines: <path d="M4 7h16M4 12h12M4 17h14" />,
  erase: (
    <>
      <path d="M8.5 5H20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8.5L3 12z" />
      <path d="M11.5 9.5l5 5M16.5 9.5l-5 5" />
    </>
  ),
  hint: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
  shift: <path d="M12 4 4 12.5h4.5V20h7v-7.5H20z" />,
  enter: (
    <>
      <path d="M19 5v6a3 3 0 0 1-3 3H6" />
      <path d="M9.5 10.5 6 14l3.5 3.5" />
    </>
  ),
  ear: (
    <>
      <path d="M7 9a5 5 0 0 1 10 0c0 3-2.5 4-3.5 6-.6 1.3-1 3-3 3a2.5 2.5 0 0 1-2.5-2.5" />
      <path d="M10 9.5a2 2 0 0 1 4 0c0 1.2-1 1.6-1.4 2.3" />
    </>
  ),
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
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
    >
      {PATHS[name]}
    </svg>
  );
}
