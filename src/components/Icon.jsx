const paths = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  upRight: "M6 18 18 6M6 6h12v12",
  play: "m9 5 11 7-11 7V5Z",
  close: "m6 6 12 12M6 18 18 6",
  menu: "M4 7h16M4 12h16M4 17h16",
  pin: "M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM9 10a3 3 0 1 0 6 0 3 3 0 1 0-6 0",
  clock: "M12 8v5l3 2M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0",
  calendar: "M5 4h14a1 1 0 0 1 1 1v15H4V5a1 1 0 0 1 1-1ZM8 2v5m8-5v5M4 10h16",
  book: "M12 5v15M12 5C8 2 4 3 2 4v15c3-2 7-1 10 1 3-2 7-3 10-1V4c-3-2-6-2-10 1Z",
  heart: "M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-4 4 0 9 8 15 8-6 12-11 8-15Z",
  people:
    "M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM17 3a4 4 0 0 1 0 8m5 10v-3a4 4 0 0 0-3-4",
  mail: "M3 5h18v14H3V5Zm0 0 9 8 9-8",
  phone: "M7 3H3c0 10 8 18 18 18v-4l-5-2-2 2-7-7 2-2-2-5Z",
  globe:
    "M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z",
  image: "M3 3h18v18H3V3Zm0 14 5-5 4 4 3-3 6 6M16 7h.01",
  chevron: "m9 5 7 7-7 7",
  check: "m5 12 4 4L19 6",
  flame:
    "M12 2c2 6-3 6-1 10 2-1 3-3 3-5 5 5 7 11 2 14-8 4-14-4-10-10 0 4 3 5 3 3-3-5 2-8 3-12Z",
};
export default function Icon({ name = "arrow", size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.arrow} />
    </svg>
  );
}
