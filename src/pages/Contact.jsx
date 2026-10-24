import { PageIntro, Eyebrow, safeUrl } from "../components/UI.jsx";
import { useContent } from "../hooks/useContent.jsx";
import { identity } from "../data/site.js";
import Icon from "../components/Icon.jsx";
export default function Contact() {
  const { settings } = useContent(),
    maps = safeUrl(settings.maps_url);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.contact_email || "")
      ? settings.contact_email
      : null,
    phone = (settings.contact_phone || "").replace(/[^\d+]/g, "");
  const socials = [
    ["YouTube", "youtube_url"],
    ["Facebook", "facebook_url"],
    ["Instagram", "instagram_url"],
    ["Telegram", "telegram_url"],
    ["Audiomack", "audiomack_url"],
  ].filter(([, key]) => safeUrl(settings[key]));
  return (
    <>
      <PageIntro
        eyebrow="YOUR NEXT STEP"
        title="We look forward to"
        emphasis="welcoming you."
      >
        Mountain of Fire and Miracles Ministries — SW8 Mega-Regional
        Headquarters, Ijebu/Remo.
      </PageIntro>
      <section className="section">
        <div className="container contact-grid">
          <div>
            <Eyebrow>VISIT OUR REGIONAL HOME</Eyebrow>
            <h2>
              Let’s connect.
              <br />
              <em>Start here.</em>
            </h2>
            <p className="lead">Ijebu-Ode, Ogun State, Nigeria.</p>
            <p>
              Planning a visit? We publish confirmed details here so you can
              find your way to our regional family.
            </p>
            <div className="contact-identity">
              <img src="/media/mfm-logo.webp" alt="" width="66" height="66" />
              <div>
                <strong>SW8 Mega Region</strong>
                <span>Ijebu / Remo</span>
              </div>
            </div>
          </div>
          <div className="contact-details">
            <article>
              <Icon name="pin" />
              <div>
                <h3>Location & directions</h3>
                <p>
                  {settings.contact_address ||
                    "Our exact street address and directions are awaiting confirmation."}
                </p>
                {maps && (
                  <a
                    href={maps}
                    className="text-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open directions
                    <Icon name="upRight" />
                  </a>
                )}
              </div>
            </article>
            <article>
              <Icon name="phone" />
              <div>
                <h3>Call our regional team</h3>
                {phone && phone.length >= 7 ? (
                  <a href={`tel:${phone}`}>{settings.contact_phone}</a>
                ) : (
                  <p>
                    A verified regional phone number will be published here.
                  </p>
                )}
              </div>
            </article>
            <article>
              <Icon name="mail" />
              <div>
                <h3>Send an email</h3>
                {email ? (
                  <a href={`mailto:${encodeURIComponent(email)}`}>{email}</a>
                ) : (
                  <p>
                    A verified regional email address will be published here.
                  </p>
                )}
              </div>
            </article>
            <article>
              <Icon name="clock" />
              <div>
                <h3>Service information</h3>
                <p>View published service times before planning your visit.</p>
                <a href="/services" className="text-link">
                  Worship with us
                  <Icon name="arrow" />
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>
      <section className="section section-tinted">
        <div className="container social-section">
          <div>
            <Eyebrow>KEEP IN TOUCH</Eyebrow>
            <h2>
              Our faith.
              <br />
              <em>Our conversations.</em>
            </h2>
          </div>
          <div>
            <p>Our regional social media identity:</p>
            <h3>{identity.social}</h3>
            {socials.length ? (
              <div className="social-links">
                {socials.map(([label, key]) => (
                  <a
                    key={key}
                    href={safeUrl(settings[key])}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {label}
                    <Icon name="upRight" size={18} />
                  </a>
                ))}
              </div>
            ) : (
              <>
                <p>
                  Find our regional display name on Facebook, Instagram,
                  YouTube, Telegram, and Audiomack.
                </p>
                <small>
                  Direct profile links will be added after verification.
                </small>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
