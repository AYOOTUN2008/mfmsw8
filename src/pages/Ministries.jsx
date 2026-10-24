import {
  PageIntro,
  SectionHeading,
  CollectionCard,
  EmptyState,
} from "../components/UI.jsx";
import { useItems } from "../hooks/useContent.jsx";
import VisitBanner from "../sections/VisitBanner.jsx";
export default function Ministries() {
  const items = useItems("ministry");
  return (
    <>
      <PageIntro
        eyebrow="A PLACE TO SERVE. A PLACE TO GROW."
        title="Different gifts."
        emphasis="One family."
      >
        Discover ways to connect, contribute, and grow within SW8 Mega Region,
        Ijebu/Remo.
      </PageIntro>
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="OUR MINISTRIES"
            title="Faith finds"
            emphasis="expression."
          />
          {items.length ? (
            <div className="card-grid">
              {items.map((item) => (
                <CollectionCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="people"
              title="Find your place in our regional family"
            >
              Verified department names and ministry profiles will be published
              here by our church team.
            </EmptyState>
          )}
        </div>
      </section>
      <VisitBanner />
    </>
  );
}
