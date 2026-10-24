import {
  PageIntro,
  Eyebrow,
  SectionHeading,
  EmptyState,
  imageUrl,
} from "../components/UI.jsx";
import { useItems } from "../hooks/useContent.jsx";
import VisitBanner from "../sections/VisitBanner.jsx";
import Icon from "../components/Icon.jsx";
export default function About() {
  const leaders = useItems("leader");
  return (
    <>
      <PageIntro
        eyebrow="OUR HOME. OUR REGION."
        title="Rooted in faith."
        emphasis="United in purpose."
      >
        Mountain of Fire and Miracles Ministries — SW8 Mega-Regional
        Headquarters, Ijebu/Remo.
      </PageIntro>
      <section className="section">
        <div className="container editorial-grid">
          <div>
            <Eyebrow>THIS IS SW8 IJEBU / REMO</Eyebrow>
            <h2>
              A regional family.
              <br />
              <em>A shared calling.</em>
            </h2>
          </div>
          <div className="prose">
            <p className="lead">
              Prayer brings us together. Faith helps us grow. Community gives us
              a place to belong.
            </p>
            <p>
              This website serves Mountain of Fire and Miracles Ministries — SW8
              Mega-Regional Headquarters, Ijebu/Remo, in Ijebu-Ode, Ogun State.
            </p>
            <p>
              Here you can discover our regional family, find published service
              information and programmes, explore messages, and share in moments
              from church life.
            </p>
            <div className="region-note">
              <Icon name="globe" />
              <p>
                Looking for the ministry’s international website?{" "}
                <a
                  href="https://www.mountainoffire.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit mountainoffire.org <Icon name="upRight" size={15} />
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="section section-tinted">
        <div className="container">
          <SectionHeading
            eyebrow="REGIONAL LEADERSHIP"
            title="Serving with"
            emphasis="purpose."
          />
          {leaders.length ? (
            <div className="leader-grid">
              {leaders.map((leader) => (
                <article className="leader-card" key={leader.id}>
                  {imageUrl(leader.image_url) ? (
                    <img
                      src={imageUrl(leader.image_url)}
                      alt={leader.title}
                      width="500"
                      height="500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="leader-emblem">
                      <img
                        src="/media/mfm-logo.webp"
                        width="100"
                        height="100"
                        alt=""
                      />
                      <span>SW8 MEGA REGION</span>
                    </div>
                  )}
                  <div>
                    <span className="eyebrow">IJEBU / REMO</span>
                    <h3>{leader.title}</h3>
                    {leader.category && (
                      <span className="leader-role">{leader.category}</span>
                    )}
                    <p>{leader.description}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState icon="people" title="Meet our regional leadership">
              Confirmed leadership profiles will be published here.
            </EmptyState>
          )}
        </div>
      </section>
      <VisitBanner />
    </>
  );
}
