import {
  PageIntro,
  SectionHeading,
  CollectionCard,
  EmptyState,
  LinkButton,
  Eyebrow,
} from "../components/UI.jsx";
import { useItems } from "../hooks/useContent.jsx";
export default function Messages() {
  const messages = useItems("sermon");
  return (
    <>
      <PageIntro
        eyebrow="FAITH FOR THE EVERYDAY"
        title="A word for"
        emphasis="your walk."
      >
        Make space for God’s Word. Keep growing in faith, prayer, and purpose.
      </PageIntro>
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="MESSAGES & TEACHING"
            title="Listen. Reflect."
            emphasis="Be renewed."
          />
          {messages.length ? (
            <div className="card-grid">
              {messages.map((item) => (
                <CollectionCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState icon="book" title="Regional messages are on the way">
              Sermons and recordings will be shared here as our regional media
              team publishes them.
            </EmptyState>
          )}
          <div className="resource-feature">
            <img
              src="/media/worship-background.webp"
              alt="An open Bible beneath a cross, from our supplied worship artwork"
              width="1000"
              height="563"
              loading="lazy"
            />
            <div>
              <Eyebrow>OFFICIAL DENOMINATIONAL RESOURCES</Eyebrow>
              <h2>
                Stay rooted.
                <br />
                <em>Keep growing.</em>
              </h2>
              <p>
                Explore the international ministry website for official MFM
                information and teaching resources.
              </p>
              <LinkButton href="https://www.mountainoffire.org" external>
                Visit the official MFM website
              </LinkButton>
              <small>
                This opens the international ministry website. Regional SW8
                messages are listed separately above.
              </small>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
