import { useState } from "react";
import {
  PageIntro,
  SectionHeading,
  CollectionCard,
  EmptyState,
} from "../components/UI.jsx";
import { useItems, useContent } from "../hooks/useContent.jsx";
export default function Events() {
  const [view, setView] = useState("upcoming"),
    events = useItems("event"),
    announcements = useItems("announcement"),
    { status } = useContent(),
    today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Africa/Lagos",
    });
  const shown = events.filter(
    (e) => view === "all" || !e.date || e.date >= today,
  );
  return (
    <>
      <PageIntro
        eyebrow="TOGETHER IN SW8"
        title="More than a date."
        emphasis="A shared experience."
      >
        Published programmes and announcements from our Ijebu/Remo regional
        family.
      </PageIntro>
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="REGIONAL PROGRAMMES"
            title="What’s"
            emphasis="ahead."
          />
          <div className="filter-row" aria-label="Filter programmes">
            <button
              className={view === "upcoming" ? "selected" : ""}
              aria-pressed={view === "upcoming"}
              onClick={() => setView("upcoming")}
            >
              Upcoming programmes
            </button>
            <button
              className={view === "all" ? "selected" : ""}
              aria-pressed={view === "all"}
              onClick={() => setView("all")}
            >
              All programmes
            </button>
          </div>
          {status === "loading" ? (
            <p role="status">Loading programmes…</p>
          ) : shown.length ? (
            <div className="card-grid">
              {shown.map((item) => (
                <CollectionCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState title="No confirmed programmes published yet">
              Check back for dates, times, and details from our regional team.
              Past media artwork is never presented as an upcoming event.
            </EmptyState>
          )}
        </div>
      </section>
      <section className="section section-tinted" id="announcements">
        <div className="container">
          <SectionHeading
            eyebrow="THE REGIONAL NOTICEBOARD"
            title="Good to"
            emphasis="know."
          />
          {announcements.length ? (
            <div className="card-grid">
              {announcements.map((item) => (
                <CollectionCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState icon="book" title="You’re up to date">
              New church announcements will appear here once published.
            </EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
