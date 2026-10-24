import { useRef } from "react";
import Hero from "../sections/Hero.jsx";
import Gallery from "../sections/Gallery.jsx";
import VisitBanner from "../sections/VisitBanner.jsx";
import {
  Eyebrow,
  SectionHeading,
  LinkButton,
  EmptyState,
  CollectionCard,
} from "../components/UI.jsx";
import Icon from "../components/Icon.jsx";
import { useContent, useItems } from "../hooks/useContent.jsx";
import { useMotion } from "../hooks/useMotion.js";
export default function Home() {
  const root = useRef(null);
  useMotion(root);
  const { settings, status } = useContent(),
    events = useItems("event").filter(
      (i) =>
        !i.date ||
        i.date >=
          new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }),
    ),
    announcements = useItems("announcement");
  return (
    <div ref={root}>
      <Hero />
      <div className="identity-ribbon">
        <div className="container">
          <span>FIRE</span>
          <i />
          <span>FAITH</span>
          <i />
          <span>WORSHIP</span>
          <i />
          <span>COMMUNITY</span>
          <i />
          <span>IJEBU / REMO</span>
        </div>
      </div>
      <section className="section welcome-section" id="welcome">
        <div className="container welcome-grid">
          <div className="welcome-photo">
            <img
              src="/media/regional-thanksgiving.webp"
              srcSet="/media/regional-thanksgiving-small.webp 640w, /media/regional-thanksgiving.webp 1000w"
              sizes="(max-width: 760px) 90vw, 40vw"
              alt="A shared moment of thanksgiving in our regional church"
              width="1000"
              height="563"
              loading="lazy"
            />
            <div className="welcome-seal">
              <span>ONE FAITH</span>
              <Icon name="flame" size={31} />
              <span>ONE FAMILY</span>
            </div>
            <span className="photo-footnote">
              REAL MOMENTS. OUR REGIONAL FAMILY.
            </span>
          </div>
          <div>
            <Eyebrow>WELCOME TO OUR REGION</Eyebrow>
            <h2>
              More than a place.
              <br />
              <em>A family of faith.</em>
            </h2>
            <p className="lead">
              A shared faith. A life of prayer.
              <br />A community to grow with.
            </p>
            <p>{settings.welcome_text}</p>
            <LinkButton href="/about" secondary>
              Get to know our region
            </LinkButton>
          </div>
        </div>
      </section>
      <section className="pathways">
        <div className="container">
          <a href="/services">
            <span className="pathway-icon">
              <Icon name="clock" size={27} />
            </span>
            <div>
              <small>GATHER IN FAITH</small>
              <h2>Worship with us</h2>
            </div>
            <Icon name="upRight" />
          </a>
          <a href="/messages">
            <span className="pathway-icon">
              <Icon name="book" size={27} />
            </span>
            <div>
              <small>GROW IN THE WORD</small>
              <h2>Find encouragement</h2>
            </div>
            <Icon name="upRight" />
          </a>
          <a href="/ministries">
            <span className="pathway-icon">
              <Icon name="people" size={27} />
            </span>
            <div>
              <small>FIND YOUR COMMUNITY</small>
              <h2>Connect & belong</h2>
            </div>
            <Icon name="upRight" />
          </a>
        </div>
      </section>
      <section className="section happenings">
        <div className="container">
          <SectionHeading
            eyebrow="LIFE IN SW8"
            title="A region moving"
            emphasis="together."
            link="/events"
            label="All programmes & updates"
          />
          <div className="happenings-grid">
            <div>
              {status === "loading" ? (
                <div className="content-skeleton" role="status">
                  Loading regional updates…
                </div>
              ) : events.length ? (
                <div className="card-grid">
                  {events.slice(0, 2).map((item) => (
                    <CollectionCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <EmptyState title="Something to look forward to">
                  Confirmed regional programmes will be shared here. Check back
                  for the latest from SW8 Ijebu/Remo.
                </EmptyState>
              )}
            </div>
            <aside className="notice-panel">
              <span className="notice-label">
                <span />
                REGIONAL NOTICEBOARD
              </span>
              {announcements.length ? (
                <>
                  <h3>{announcements[0].title}</h3>
                  <p>{announcements[0].description}</p>
                </>
              ) : (
                <>
                  <h3>
                    Stay close.
                    <br />
                    Stay connected.
                  </h3>
                  <p>
                    Church announcements will appear here once confirmed and
                    published by our regional team.
                  </p>
                </>
              )}
              <a className="text-link" href="/events#announcements">
                View announcements
                <Icon name="arrow" />
              </a>
            </aside>
          </div>
        </div>
      </section>
      <section className="word-section">
        <div className="container word-grid">
          <div className="word-visual">
            <img
              src="/media/worship-background.webp"
              alt="An open Bible beneath a cross, from the supplied church worship artwork"
              loading="lazy"
              width="1000"
              height="563"
            />
            <span>THE WORD IS ALIVE</span>
          </div>
          <div>
            <Eyebrow light>A WORD FOR YOUR WALK</Eyebrow>
            <h2>
              Be encouraged.
              <br />
              <em>Keep growing.</em>
            </h2>
            <p>
              Make space for the Word in your everyday life. Explore messages
              and teaching that point you back to faith, prayer, and purpose.
            </p>
            <LinkButton href="/messages">Explore messages</LinkButton>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="THE BEAUTY OF BELONGING"
            title="Our people."
            emphasis="Our story."
            link="/media"
            label="Explore the regional gallery"
          />
          <Gallery limit={3} />
        </div>
      </section>
      <VisitBanner />
    </div>
  );
}
