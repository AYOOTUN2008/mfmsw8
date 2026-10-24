import {
  PageIntro,
  SectionHeading,
  CollectionCard,
  EmptyState,
  LinkButton,
} from "../components/UI.jsx";
import { useContent, useItems } from "../hooks/useContent.jsx";
import Icon from "../components/Icon.jsx";
export default function Services() {
  const items = useItems("service"),
    { status } = useContent();
  return (
    <>
      <PageIntro
        eyebrow="GATHER IN FAITH"
        title="Come with expectation."
        emphasis="Find your place."
      >
        Worship, prayer, and the Word. Connect with our SW8 Ijebu/Remo regional
        family.
      </PageIntro>
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="WORSHIP WITH US"
            title="Make room for"
            emphasis="encounter."
          />
          {status === "loading" ? (
            <p role="status">Loading service information…</p>
          ) : items.length ? (
            <div className="card-grid">
              {items.map((item) => (
                <CollectionCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState icon="clock" title="Service times are being confirmed">
              Our verified regional service schedule will be published here.
              We’re keeping this information accurate so you can plan with
              confidence.
            </EmptyState>
          )}
          <div className="visitor-grid">
            <article>
              <span>01</span>
              <Icon name="pin" />
              <h3>Our regional home</h3>
              <p>
                SW8 Mega-Regional Headquarters, Ijebu/Remo. Ijebu-Ode, Ogun
                State.
              </p>
            </article>
            <article>
              <span>02</span>
              <Icon name="heart" />
              <h3>A place to belong</h3>
              <p>
                Come ready to share in prayer, worship, and the teaching of
                God’s Word.
              </p>
            </article>
            <article>
              <span>03</span>
              <Icon name="people" />
              <h3>Plan your visit</h3>
              <p>
                Find our confirmed address, directions, and contact information
                as they become available.
              </p>
            </article>
          </div>
          <LinkButton href="/contact" secondary>
            Visitor information
          </LinkButton>
        </div>
      </section>
    </>
  );
}
