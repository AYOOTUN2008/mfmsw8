import Icon from "./Icon.jsx";
export function LinkButton({
  href,
  children,
  secondary = false,
  external = false,
  ...props
}) {
  return (
    <a
      className={`button ${secondary ? "button-outline" : ""}`}
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...props}
    >
      {children}
      <Icon name={external ? "upRight" : "arrow"} size={18} />
    </a>
  );
}
export function Eyebrow({ children, light = false }) {
  return (
    <div className={`eyebrow ${light ? "eyebrow-light" : ""}`}>
      <span />
      {children}
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  emphasis,
  children,
  link,
  label,
}) {
  return (
    <div className="section-heading">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2>
          {title} {emphasis && <em>{emphasis}</em>}
        </h2>
        {children && <p>{children}</p>}
      </div>
      {link && (
        <a className="text-link" href={link}>
          {label}
          <Icon name="arrow" />
        </a>
      )}
    </div>
  );
}
export function EmptyState({ icon = "calendar", title, children }) {
  return (
    <div className="empty-state">
      <span className="icon-disc">
        <Icon name={icon} size={26} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}
export function PageIntro({ eyebrow, title, emphasis, children }) {
  return (
    <section className="page-intro">
      <div className="container">
        <Eyebrow light>{eyebrow}</Eyebrow>
        <h1>
          {title} {emphasis && <em>{emphasis}</em>}
        </h1>
        <p>{children}</p>
        <span className="intro-orbit" aria-hidden="true" />
      </div>
    </section>
  );
}
export function safeUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const u = new URL(value);
    return ["https:", "http:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export function imageUrl(value) {
  if (typeof value === "string" && /^\/media\/[a-zA-Z0-9._-]+$/.test(value))
    return value;
  return safeUrl(value);
}
export function friendlyDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "";
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Africa/Lagos",
      }).format(date);
}
export function CollectionCard({ item }) {
  const img = imageUrl(item.image_url),
    video = safeUrl(item.video_url),
    audio = safeUrl(item.audio_url);
  return (
    <article className="content-card">
      {img && (
        <img
          src={img}
          alt={item.title}
          loading="lazy"
          width="700"
          height="440"
        />
      )}
      <div className="content-card-body">
        {item.featured && <span className="badge">Featured</span>}
        <h3>{item.title}</h3>
        {item.description && <p>{item.description}</p>}
        <div className="card-meta">
          {item.kind === "service" && item.category && (
            <span>
              <Icon name="calendar" size={16} />
              {item.category}
            </span>
          )}
          {item.date && (
            <span>
              <Icon name="calendar" size={16} />
              {friendlyDate(item.date)}
            </span>
          )}
          {item.time && (
            <span>
              <Icon name="clock" size={16} />
              {item.time}
            </span>
          )}
          {item.location && (
            <span>
              <Icon name="pin" size={16} />
              {item.location}
            </span>
          )}
          {item.speaker && <span>{item.speaker}</span>}
        </div>
        {video && (
          <a
            className="text-link"
            href={video}
            target="_blank"
            rel="noopener noreferrer"
          >
            Watch message
            <Icon name="upRight" />
          </a>
        )}
        {audio && (
          <a
            className="text-link"
            href={audio}
            target="_blank"
            rel="noopener noreferrer"
          >
            Listen to audio
            <Icon name="upRight" />
          </a>
        )}
      </div>
    </article>
  );
}
