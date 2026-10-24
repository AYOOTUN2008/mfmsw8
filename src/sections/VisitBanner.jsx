import { Eyebrow, LinkButton } from "../components/UI.jsx";
export default function VisitBanner() {
  return (
    <section className="visit-banner">
      <div className="container">
        <div>
          <Eyebrow light>THERE IS A PLACE FOR YOU HERE</Eyebrow>
          <h2>
            Your next chapter.
            <br />
            <em>Our shared journey.</em>
          </h2>
        </div>
        <div>
          <p>
            Come with an open heart.
            <br />
            Connect with our SW8 Ijebu/Remo family.
          </p>
          <LinkButton href="/contact">Plan your visit</LinkButton>
        </div>
        <span className="banner-orbit" aria-hidden="true" />
      </div>
    </section>
  );
}
