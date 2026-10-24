import { useState } from "react";
import { useContent } from "../hooks/useContent.jsx";
import { LinkButton } from "../components/UI.jsx";
import Icon from "../components/Icon.jsx";
import MediaDialog from "../components/MediaDialog.jsx";
import "../styles/hero.css";

const photographs = [
  {
    image: "regional-fellowship",
    width: 1400,
    title: "A regional family united in prayer",
    description:
      "Members of our Ijebu/Remo regional church sharing a moment of prayer",
    position: "50% 40%",
    mobilePosition: "53% 45%",
  },
  {
    image: "regional-prayer",
    width: 1000,
    title: "Faith and fellowship in SW8",
    description: "Our regional church family gathered together for prayer",
    position: "50% 40%",
    mobilePosition: "48% 45%",
  },
  {
    image: "regional-thanksgiving",
    width: 1000,
    title: "Thanksgiving in our regional home",
    description:
      "Church members sharing a moment of thanksgiving in Ijebu/Remo",
    position: "50% 38%",
    mobilePosition: "58% 42%",
  },
];

export default function Hero() {
  const { settings } = useContent();
  const [active, setActive] = useState(0);
  const [media, setMedia] = useState(null);
  const photograph = photographs[active];
  const changePhotograph = (direction) =>
    setActive(
      (current) =>
        (current + direction + photographs.length) % photographs.length,
    );

  return (
    <section
      className="hero hero-panorama"
      role="region"
      aria-roledescription="carousel"
      aria-label="Welcome to MFM SW8 Ijebu/Remo"
    >
      <div
        className="hero-backdrop"
        style={{
          "--photo-position": photograph.position,
          "--photo-mobile-position": photograph.mobilePosition,
        }}
      >
        <img
          key={photograph.image}
          src={`/media/${photograph.image}.webp`}
          srcSet={`/media/${photograph.image}-small.webp 640w, /media/${photograph.image}.webp ${photograph.width}w`}
          sizes="100vw"
          width={photograph.width}
          height={Math.round((photograph.width * 9) / 16)}
          alt={photograph.description}
          fetchPriority={active === 0 ? "high" : "auto"}
        />
      </div>
      <div className="hero-backdrop-overlay" aria-hidden="true" />
      <div className="hero-content">
        <p className="hero-kicker hero-enter">SW8 MEGA REGION · IJEBU / REMO</p>
        <h1 className="hero-enter">{settings.hero_heading}</h1>
        <p className="hero-region hero-enter">
          SW8 Mega-Regional Headquarters
          <br />
          <span>Ijebu / Remo</span>
        </p>
        <p className="hero-subheading hero-enter">{settings.hero_subheading}</p>
        <div className="hero-actions hero-enter">
          <LinkButton href="/services">{settings.hero_cta}</LinkButton>
          <LinkButton href="/about" secondary>
            Explore our region
          </LinkButton>
        </div>
      </div>

      <button
        className="hero-arrow hero-previous"
        aria-label="Previous photograph"
        onClick={() => changePhotograph(-1)}
      >
        <Icon name="chevron" size={30} />
      </button>
      <button
        className="hero-arrow hero-next"
        aria-label="Next photograph"
        onClick={() => changePhotograph(1)}
      >
        <Icon name="chevron" size={30} />
      </button>

      <div className="hero-bottom-bar">
        <button
          className="hero-watch"
          onClick={() =>
            setMedia({
              type: "video",
              src: "/media/new-motion-logo.mp4",
              poster: "/media/new-motion-poster.webp",
              title: "MFM — our current motion identity",
            })
          }
        >
          <span>
            <Icon name="play" size={16} />
          </span>
          Watch our motion identity
        </button>
        <div
          className="hero-pagination"
          aria-label="Choose a regional photograph"
        >
          {photographs.map((photo, index) => (
            <button
              key={photo.image}
              aria-label={`Show photograph ${index + 1}`}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            >
              <span />
            </button>
          ))}
        </div>
        <a className="hero-discover" href="#welcome">
          Discover our regional family
          <Icon name="arrow" size={17} />
        </a>
      </div>
      <p className="screen-reader-only" aria-live="polite" aria-atomic="true">
        Photograph {active + 1} of {photographs.length}: {photograph.title}
      </p>
      <MediaDialog media={media} onClose={() => setMedia(null)} />
    </section>
  );
}
