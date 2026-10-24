import { useEffect, useRef, useState } from "react";
import { identity, navigation, pages } from "../data/site.js";
import Icon from "./Icon.jsx";
export function Brand() {
  return (
    <a className="brand" href="/" aria-label="MFM SW8 Mega Region home">
      <img src="/media/mfm-logo.webp" alt="" width="54" height="54" />
      <span>
        MFM <strong>SW8</strong>
        <small>MEGA REGION · IJEBU/REMO</small>
      </span>
    </a>
  );
}
export function Header() {
  const [open, setOpen] = useState(false),
    [scrolled, setScrolled] = useState(false);
  const toggle = useRef(null);
  const home = location.pathname === "/";
  useEffect(() => {
    const scroll = () => setScrolled(scrollY > 30);
    scroll();
    addEventListener("scroll", scroll, { passive: true });
    return () => removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const key = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current.focus();
      }
    };
    const outside = (e) => {
      if (!e.target.closest(".site-header")) setOpen(false);
    };
    addEventListener("keydown", key);
    addEventListener("click", outside);
    return () => {
      removeEventListener("keydown", key);
      removeEventListener("click", outside);
    };
  }, [open]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {!home && (
        <div className="topline">
          <div className="container">
            <span>{identity.name}</span>
            <span>
              SW8 MEGA REGION <b>·</b> IJEBU / REMO
            </span>
          </div>
        </div>
      )}
      <header
        className={`site-header ${home ? "header-over-hero" : ""} ${scrolled ? "scrolled" : ""}`}
      >
        <div className="container header-inner">
          <Brand />
          <button
            className="menu-toggle"
            ref={toggle}
            aria-controls="main-navigation"
            aria-expanded={open}
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
            <span>Menu</span>
          </button>
          <nav
            id="main-navigation"
            aria-label="Main navigation"
            className={open ? "open" : ""}
          >
            {home && (
              <a href="/" aria-current="page" onClick={() => setOpen(false)}>
                Home
              </a>
            )}
            {navigation.map(([href, label]) => (
              <a
                key={href}
                href={href}
                aria-current={location.pathname === href ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {label}
              </a>
            ))}
            <a
              href="/contact"
              className="nav-cta"
              onClick={() => setOpen(false)}
            >
              Plan your visit
              <Icon name="upRight" size={17} />
            </a>
          </nav>
        </div>
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Brand />
            <p>
              A regional family of prayer,
              <br />
              faith and transformed lives.
            </p>
            <span className="footer-locality">
              Ijebu-Ode, Ogun State, Nigeria
            </span>
          </div>
          <div>
            <h2>Explore SW8</h2>
            <a href="/about">Our region & leadership</a>
            <a href="/services">Worship with us</a>
            <a href="/events">Programmes & updates</a>
            <a href="/ministries">Ministries</a>
          </div>
          <div>
            <h2>Stay connected</h2>
            <a href="/messages">Messages & teaching</a>
            <a href="/media">Photo gallery & films</a>
            <a href="/contact">Contact & directions</a>
            <a
              href="https://www.mountainoffire.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              International MFM website <Icon name="upRight" size={14} />
            </a>
          </div>
          <div className="footer-scripture">
            <span>FIRE. FAITH. FAMILY.</span>
            <blockquote>
              “For with God nothing
              <br />
              shall be impossible.”
            </blockquote>
            <small>LUKE 1:37 · KJV</small>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} MFM SW8 Mega Region, Ijebu/Remo.</p>
          <p>A regional website of Mountain of Fire and Miracles Ministries.</p>
          <a href="/admin.html">
            Staff sign in
            <Icon name="upRight" size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
export function Meta({ path }) {
  useEffect(() => {
    const page = pages[path] || {
      title: "Page not found",
      description: "MFM SW8 Mega Region, Ijebu/Remo",
    };
    document.title =
      path === "/" ? page.title : `${page.title} | MFM SW8 Ijebu/Remo`;
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", page.description);
    document
      .querySelector('meta[property="og:title"]')
      .setAttribute("content", document.title);
    document
      .querySelector('meta[property="og:description"]')
      .setAttribute("content", page.description);
    try {
      const u = new URL(
        import.meta.env.VITE_SITE_URL ||
          "https://mfmsw8-mega-region.vercel.app",
      );
      if (u.protocol === "https:") {
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
          link = document.createElement("link");
          link.rel = "canonical";
          document.head.append(link);
        }
        link.href = u.origin + path;
        document
          .querySelector('meta[property="og:url"]')
          ?.setAttribute("content", u.origin + path);
      }
    } catch {}
  }, [path]);
  return null;
}
