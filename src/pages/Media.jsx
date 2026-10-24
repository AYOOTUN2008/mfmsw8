import { PageIntro, SectionHeading, Eyebrow } from "../components/UI.jsx";
import Gallery from "../sections/Gallery.jsx";
import { identity } from "../data/site.js";
export default function Media() {
  return (
    <>
      <PageIntro
        eyebrow="REAL MOMENTS. A LIVING FAITH."
        title="The heart of"
        emphasis="our region."
      >
        Worship, prayer, and life together. Glimpses of our SW8 Ijebu/Remo
        family.
      </PageIntro>
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="THE REGIONAL ALBUM"
            title="Our people."
            emphasis="Our story."
          />
          <Gallery />
        </div>
      </section>
      <section className="section section-tinted">
        <div className="container film-grid">
          <div>
            <Eyebrow>FROM OUR REGIONAL MEDIA TEAM</Eyebrow>
            <h2>
              Welcome to
              <br />
              <em>Ijebu / Remo.</em>
            </h2>
            <p>
              A short introduction to our regional identity, prepared by our
              media team.
            </p>
            <span className="social-display-name">{identity.social}</span>
            <p className="social-platforms">
              Facebook · Instagram · YouTube · Telegram · Audiomack
            </p>
          </div>
          <video
            controls
            playsInline
            preload="none"
            poster="/media/regional-socials.webp"
            aria-label="Ijebu/Remo regional introduction"
          >
            <source
              src="/media/sw8-regional-introduction.mp4"
              type="video/mp4"
            />
            Your browser does not support video playback.
          </video>
        </div>
      </section>
    </>
  );
}
