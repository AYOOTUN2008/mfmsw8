import { useState } from "react";
import { useContent } from "../hooks/useContent.jsx";
import { defaults } from "../data/site.js";
import { Eyebrow, LinkButton } from "../components/UI.jsx";
import Icon from "../components/Icon.jsx";
import MediaDialog from "../components/MediaDialog.jsx";
export default function Hero() {
  const { settings } = useContent();
  const [media, setMedia] = useState(null);
  return (
    <section className="hero">
      <div className="hero-atmosphere" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="hero-enter">
            <Eyebrow light>SW8 MEGA REGION · IJEBU / REMO</Eyebrow>
          </div>
          <h1 className="hero-enter">
            {settings.hero_heading === defaults.hero_heading ? (
              <>
                A place of <em>fire,</em>
                <br />
                faith & miracles.
              </>
            ) : (
              settings.hero_heading
            )}
          </h1>
          <p className="hero-subheading hero-enter">
            {settings.hero_subheading}
          </p>
          <p className="hero-identity hero-enter">
            Mountain of Fire and Miracles Ministries
            <br />
            <strong>SW8 Mega-Regional Headquarters, Ijebu/Remo</strong>
          </p>
          <div className="hero-actions hero-enter">
            <LinkButton href="/contact">{settings.hero_cta}</LinkButton>
            <a className="hero-secondary" href="/about">
              Explore our region
              <Icon name="upRight" size={18} />
            </a>
          </div>
          <div className="hero-note hero-enter">
            <span className="flame-disc">
              <Icon name="flame" size={24} />
            </span>
            <span>
              Rooted in the Word.
              <br />
              <strong>United in prayer.</strong>
            </span>
            <span className="hero-note-line" />
            <span>
              One faith.
              <br />
              <strong>One regional family.</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-one" aria-hidden="true" />
          <div className="orbit orbit-two" aria-hidden="true" />
          <div className="hero-photo-frame">
            <img
              src="/media/regional-fellowship.webp"
              srcSet="/media/regional-fellowship-small.webp 640w, /media/regional-fellowship.webp 1400w"
              sizes="(max-width: 760px) 90vw, 45vw"
              width="1400"
              height="788"
              alt="Members of our Ijebu/Remo regional church sharing a moment of prayer"
              fetchPriority="high"
            />
            <div className="hero-photo-shade" />
            <span className="photo-label">
              <span />
              THE HEART OF OUR REGION
            </span>
          </div>
          <div className="hero-crest">
            <img
              src="/media/mfm-logo.webp"
              alt="MFM ministry logo"
              width="88"
              height="88"
            />
          </div>
          <button
            className="film-button"
            onClick={() =>
              setMedia({
                type: "video",
                src: "/media/new-motion-logo.mp4",
                poster: "/media/new-motion-poster.webp",
                title: "MFM — our current motion identity",
              })
            }
          >
            <span className="play-disc">
              <Icon name="play" size={18} />
            </span>
            <span>
              FIRE. FAITH. PURPOSE.
              <small>Watch our motion identity · 7 seconds</small>
            </span>
            <Icon name="upRight" size={20} />
          </button>
          <span className="visual-index">01 — A LIVING FAITH</span>
        </div>
      </div>
      <div className="hero-base container">
        <span>PRAYER IS OUR FOUNDATION.</span>
        <a href="#welcome">
          Discover the SW8 family
          <Icon name="arrow" size={16} />
        </a>
        <span>IJEBU / REMO, NIGERIA</span>
      </div>
      <MediaDialog media={media} onClose={() => setMedia(null)} />
    </section>
  );
}
