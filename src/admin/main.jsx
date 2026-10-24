import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import { supabase, isConfigured, officeAuthLink } from "../lib/supabase.js";
import { clearOfficeAuthFragment } from "../lib/auth-links.js";
import { KINDS, SETTING_FIELDS, safeUrl } from "../lib/validation.js";
import {
  isAdmin,
  getAdminContent,
  saveItem,
  deleteItem,
  saveSettings,
  setPublished,
} from "../services/content.js";
import {
  uploadImage,
  imagePreview,
  listMedia,
  deleteMedia,
} from "../services/media.js";
import "./admin.css";

const sections = {
  event: ["Programmes", "programme"],
  service: ["Service times", "service"],
  announcement: ["Announcements", "announcement"],
  sermon: ["Messages", "message"],
  ministry: ["Ministries", "ministry"],
  gallery: ["Photo gallery", "photograph"],
  leader: ["Leadership", "leader"],
};
const blankItem = (kind) => ({
  kind,
  title: "",
  description: "",
  date: "",
  time: "",
  location: "",
  speaker: "",
  category: "",
  image_url: "",
  video_url: "",
  audio_url: "",
  published: false,
  featured: false,
  sort_order: 0,
});
function Brand() {
  return (
    <a className="office-brand" href="/">
      <img src="/media/mfm-logo.webp" width="47" height="47" alt="MFM logo" />
      <span>
        MFM <b>SW8</b>
        <small>IJEBU / REMO · CHURCH OFFICE</small>
      </span>
    </a>
  );
}
function Arrow() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}
function Notice({ children, error = false }) {
  return children ? (
    <div
      className={`office-notice${error ? " error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  ) : null;
}
function Screen({ title, children }) {
  return (
    <div className="office-entry">
      <div className="office-entry-art">
        <Brand />
        <div>
          <span className="office-eyebrow">BEHIND EVERY GATHERING</span>
          <h1>
            A little care.
            <br />A lasting <em>impact.</em>
          </h1>
          <p>
            A simple space to care for your church website, and keep our
            regional family connected.
          </p>
        </div>
        <small>SW8 MEGA REGION · IJEBU / REMO</small>
      </div>
      <main className="office-entry-main">
        <div className="office-entry-card">
          <a className="office-back" href="/">
            ← Back to the website
          </a>
          <span className="office-eyebrow">MFM SW8 · CHURCH OFFICE</span>
          <h2>{title}</h2>
          {children}
        </div>
      </main>
    </div>
  );
}
function Setup() {
  return (
    <Screen title="A home for your updates.">
      <p>
        The church office is ready to connect. Your website continues to work
        while the content service is being set up.
      </p>
      <div className="office-setup">
        <h3>One-time connection needed</h3>
        <p>
          The website owner needs to connect the church’s Supabase project and
          create approved staff accounts. There is no public sign-up.
        </p>
        <p>
          Setup instructions are included in <code>docs/CMS-SETUP.md</code> in
          the project repository.
        </p>
      </div>
      <a className="office-primary" href="/">
        Explore the website <Arrow />
      </a>
      <small className="office-help">
        Please keep account passwords and private project keys out of messages
        and website content.
      </small>
    </Screen>
  );
}
function Login({ linkError = false }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reset, setReset] = useState(false);
  const [sent, setSent] = useState(false);
  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (result.error) throw result.error;
    } catch {
      setError(
        "We could not sign you in. Check your email and password, then try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function requestReset(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: new URL("/admin.html", window.location.origin).href,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setError(
        "We could not send a reset link. Please wait a moment and try again, or contact the website owner.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen title={reset ? "Reset your password." : "Welcome back."}>
      <p>
        {reset
          ? "Enter your approved staff email. We will send a secure link if the account can receive password recovery."
          : "Sign in to update your regional church website."}
      </p>
      {linkError && (
        <Notice error>
          This account link has expired or could not be verified. Request a
          fresh password reset link, or ask the website owner to resend your
          invitation.
        </Notice>
      )}
      <form onSubmit={reset ? requestReset : login}>
        <Notice error>{error}</Notice>
        {sent ? (
          <Notice>
            If this account can receive password recovery, a reset link has been
            sent. Check your inbox and spam folder. This message does not
            confirm whether an account exists.
          </Notice>
        ) : (
          <>
            <label>
              Email address
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your approved staff email"
              />
            </label>
            {!reset && (
              <label>
                Password
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            <button className="office-primary" disabled={busy}>
              {busy
                ? reset
                  ? "Sending link…"
                  : "Signing in…"
                : reset
                  ? "Send password reset link"
                  : "Sign in securely"}
              <Arrow />
            </button>
          </>
        )}
      </form>
      <button
        type="button"
        className="office-text-button"
        disabled={busy}
        onClick={() => {
          setReset((value) => !value);
          setError("");
          setSent(false);
        }}
      >
        {reset ? "Back to sign in" : "Forgot your password?"}
      </button>
      <small className="office-help">
        Need a new staff account? Ask the website owner to invite you. Reset
        links do not grant website editing permission.
      </small>
    </Screen>
  );
}
function SetPassword({ intent, email, onSignOut }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState(false);
  async function save(e) {
    e.preventDefault();
    setError("");
    if (password.length < 12) {
      setError("Choose a password with at least 12 characters.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match. Please enter them again.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmation("");
      setUpdated(true);
      const signedOut = await onSignOut();
      if (!signedOut)
        setError(
          "Your password is updated, but sign out did not finish. Use the sign-out button below to try again.",
        );
    } catch {
      setError(
        "We could not finish updating your password. Try again, or sign out and request a fresh link.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function leave() {
    setBusy(true);
    setError("");
    const ok = await onSignOut();
    if (!ok) {
      setError(
        "We could not sign you out. Please check your connection and try again.",
      );
      setBusy(false);
    }
  }
  return (
    <Screen
      title={
        updated
          ? "Your password is updated."
          : intent === "invite"
            ? "Set up your staff password."
            : "Choose a new password."
      }
    >
      <p>
        {updated
          ? "Sign out, then sign in with your new password."
          : "Choose a strong password that you do not use for another account. Your editing access is still checked against the approved staff list."}
      </p>
      <Notice error>{error}</Notice>
      <p>
        <strong>{email}</strong>
      </p>
      {!updated && (
        <form onSubmit={save}>
          <fieldset disabled={busy}>
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                minLength="12"
                maxLength="256"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                minLength="12"
                maxLength="256"
                required
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            <small className="office-help">
              Use at least 12 characters. A long, memorable phrase works well.
            </small>
            <button className="office-primary" disabled={busy}>
              {busy ? "Updating password…" : "Save password & sign out"}
              <Arrow />
            </button>
          </fieldset>
        </form>
      )}
      <button
        type="button"
        className="office-text-button"
        disabled={busy}
        onClick={leave}
      >
        {updated ? "Sign out and return to login" : "Cancel and sign out"}
      </button>
    </Screen>
  );
}
function ImageField({ value, onChange, disabled, onBusyChange = () => {} }) {
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  useEffect(() => {
    let active = true;
    imagePreview(value)
      .then((url) => {
        if (active) setPreview(url);
      })
      .catch(() => {
        if (active) setPreview("");
      });
    return () => {
      active = false;
    };
  }, [value]);
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    onBusyChange(true);
    setError("");
    setProgress(0);
    try {
      const reference = await uploadImage(file, setProgress);
      onChange(reference);
    } catch (e) {
      setError(e.message || "Could not upload this photograph.");
    } finally {
      setBusy(false);
      onBusyChange(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  return (
    <div className="office-image-field">
      <span className="office-field-label">Photograph</span>
      {preview && (
        <img
          className="office-image-preview"
          src={preview}
          alt="Selected content photograph"
        />
      )}
      <label className="office-upload">
        <span>
          {busy ? "Uploading your photograph…" : "Upload a photograph"}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={upload}
          disabled={busy || disabled}
        />
      </label>
      {busy && (
        <progress
          value={progress}
          max="100"
          aria-label="Photograph upload progress"
        >
          {progress}%
        </progress>
      )}
      <small>
        JPG, PNG or WebP · maximum 5 MB. We resize large photographs for faster
        loading.
      </small>
      <Notice error>{error}</Notice>
      <label>
        Or use an existing image link
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or /media/…"
          disabled={busy || disabled}
        />
      </label>
      {value && (
        <button
          type="button"
          className="office-text-button"
          onClick={() => onChange("")}
          disabled={busy || disabled}
        >
          Remove photograph from this item
        </button>
      )}
    </div>
  );
}
function Field({
  label,
  name,
  value,
  set,
  type = "text",
  multiline = false,
  ...rest
}) {
  return (
    <label>
      {label}
      {multiline ? (
        <textarea
          name={name}
          value={value || ""}
          onChange={(e) => set(name, e.target.value)}
          rows="5"
          {...rest}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value ?? ""}
          onChange={(e) => set(name, e.target.value)}
          {...rest}
        />
      )}
    </label>
  );
}
function ContentEditor({ item, onSaved, onCancel, onError }) {
  const [form, setForm] = useState({ ...item });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const kind = form.kind;
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveItem(form);
      await onSaved();
    } catch (e) {
      const message =
        e.message || "This update could not be saved. Please try again.";
      setError(message);
      onError?.(message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="office-panel office-editor">
      <div className="office-panel-heading">
        <div>
          <span className="office-eyebrow">
            {item.id ? "EDIT CONTENT" : "SOMETHING NEW"}
          </span>
          <h2>
            {item.id ? "Edit" : "Add"} {sections[kind][1]}
          </h2>
        </div>
        <button
          type="button"
          className="office-secondary"
          onClick={onCancel}
          disabled={busy}
        >
          Close editor
        </button>
      </div>
      <p className="office-muted">
        Use confirmed regional information. Save a draft first, or switch on
        “Publish on website” when it is ready.
      </p>
      <form onSubmit={save}>
        <fieldset disabled={busy || uploading}>
          <Notice error>{error}</Notice>
          <div className="office-form-grid">
            <div>
              <Field
                label={
                  kind === "leader"
                    ? "Full name"
                    : kind === "gallery"
                      ? "Photograph caption"
                      : "Title"
                }
                name="title"
                value={form.title}
                set={set}
                required
                maxLength={160}
              />
              <Field
                label={
                  kind === "leader" ? "Introduction / biography" : "Description"
                }
                name="description"
                value={form.description}
                set={set}
                multiline
                maxLength={10000}
              />
              {["event", "announcement", "sermon"].includes(kind) && (
                <Field
                  label={kind === "event" ? "Confirmed programme date" : "Date"}
                  name="date"
                  type="date"
                  value={form.date}
                  set={set}
                />
              )}
              <div className="office-two-fields">
                {["event", "service"].includes(kind) && (
                  <Field
                    label="Time (include your timezone if needed)"
                    name="time"
                    value={form.time}
                    set={set}
                    maxLength={80}
                    placeholder="Enter the confirmed time"
                  />
                )}
                {["service", "gallery", "leader"].includes(kind) && (
                  <Field
                    label={
                      kind === "service"
                        ? "Day / recurrence"
                        : kind === "leader"
                          ? "Role / title"
                          : "Category"
                    }
                    name="category"
                    value={form.category}
                    set={set}
                    maxLength={120}
                    placeholder={
                      kind === "service" ? "Enter the confirmed day" : ""
                    }
                  />
                )}
              </div>
              {["event", "service"].includes(kind) && (
                <Field
                  label="Confirmed location"
                  name="location"
                  value={form.location}
                  set={set}
                  maxLength={500}
                />
              )}{" "}
              {kind === "sermon" && (
                <>
                  <Field
                    label="Speaker"
                    name="speaker"
                    value={form.speaker}
                    set={set}
                    maxLength={160}
                  />
                  <Field
                    label="Video link"
                    name="video_url"
                    type="url"
                    value={form.video_url}
                    set={set}
                    maxLength={2048}
                    placeholder="https://www.youtube.com/…"
                  />
                  <Field
                    label="Audio link (optional)"
                    name="audio_url"
                    type="url"
                    value={form.audio_url}
                    set={set}
                    maxLength={2048}
                  />
                  <small>
                    Use a YouTube or other secure media link. Video files are
                    not uploaded here.
                  </small>
                </>
              )}
            </div>
            <div>
              <ImageField
                value={form.image_url}
                onChange={(value) => set("image_url", value)}
                disabled={busy}
                onBusyChange={setUploading}
              />
              <div className="office-publish-box">
                <label className="office-checkbox">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => set("published", e.target.checked)}
                  />
                  <span>
                    Publish on website
                    <small>Off means this is a private draft.</small>
                  </span>
                </label>
                <label className="office-checkbox">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => set("featured", e.target.checked)}
                  />
                  <span>Feature this item</span>
                </label>
                <Field
                  label="Display order"
                  name="sort_order"
                  type="number"
                  value={form.sort_order}
                  set={set}
                  min={-10000}
                  max={10000}
                  step="1"
                />
                <small>Lower numbers appear first.</small>
              </div>
            </div>
          </div>
          <div className="office-form-actions">
            <button className="office-primary" type="submit">
              {busy
                ? "Saving…"
                : form.published
                  ? "Save & publish"
                  : "Save draft"}
              <Arrow />
            </button>
            <button
              type="button"
              className="office-secondary"
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? "Hide preview" : "Preview this content"}
            </button>
            <span>
              {form.published
                ? "This will be visible to website visitors."
                : "Only approved staff will see this draft."}
            </span>
          </div>
          {preview && (
            <div className="office-content-preview">
              <span className="office-eyebrow">
                CONTENT PREVIEW · NOT YET SAVED
              </span>
              <h3>{form.title || "Your title"}</h3>
              <p>{form.description || "Your description will appear here."}</p>
              {form.date && (
                <p>
                  {form.date} {form.time}
                </p>
              )}
              {form.location && <p>{form.location}</p>}
            </div>
          )}
        </fieldset>
      </form>
    </section>
  );
}
function SettingsEditor({ settings, onSaved }) {
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const groups = [
    [
      "Homepage",
      ["hero_heading", "hero_subheading", "hero_cta", "welcome_text"],
    ],
    [
      "Contact & directions",
      ["contact_address", "contact_phone", "contact_email", "maps_url"],
    ],
    [
      "Official social profiles",
      [
        "youtube_url",
        "facebook_url",
        "instagram_url",
        "telegram_url",
        "audiomack_url",
      ],
    ],
  ];
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveSettings(form);
      await onSaved();
    } catch (e) {
      setError(e.message || "Could not publish these changes.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="office-panel">
      <div className="office-panel-heading">
        <div>
          <span className="office-eyebrow">KEEP YOUR WEBSITE CURRENT</span>
          <h2>Page text & contact</h2>
        </div>
      </div>
      <p className="office-muted">
        These changes publish immediately when saved. Leave a field blank to use
        the website’s existing wording or show no unverified contact detail.
      </p>
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <Notice error>{error}</Notice>
          {groups.map(([title, keys]) => (
            <div className="office-settings-group" key={title}>
              <h3>{title}</h3>
              <div>
                {keys.map((key) => (
                  <Field
                    key={key}
                    label={SETTING_FIELDS[key][0]}
                    name={key}
                    value={form[key]}
                    set={(name, value) =>
                      setForm((f) => ({ ...f, [name]: value }))
                    }
                    type={
                      key.endsWith("_url")
                        ? "url"
                        : key === "contact_email"
                          ? "email"
                          : "text"
                    }
                    multiline={[
                      "hero_subheading",
                      "welcome_text",
                      "contact_address",
                    ].includes(key)}
                    maxLength={SETTING_FIELDS[key][1]}
                  />
                ))}
              </div>
            </div>
          ))}
          <button className="office-primary" type="submit">
            {busy ? "Publishing…" : "Publish page changes"}
            <Arrow />
          </button>
        </fieldset>
      </form>
    </section>
  );
}
function MediaLibrary({ notify }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  async function load(append = false) {
    setLoading(true);
    setError("");
    try {
      const batch = await listMedia(append ? files.length : 0);
      setFiles((old) => (append ? [...old, ...batch] : batch));
      setHasMore(batch.length === 40);
    } catch {
      setError("The photo library could not load. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setProgress(0);
    try {
      await uploadImage(file, setProgress);
      await load();
      notify(
        "Photograph uploaded. Add it to a gallery item or other content to publish it.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }
  async function remove(file) {
    if (
      !window.confirm(
        "Permanently delete this photograph from the library? Photographs already used in content cannot be deleted here.",
      )
    )
      return;
    setBusy(true);
    try {
      await deleteMedia(file.reference);
      await load();
      notify("Photograph deleted.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="office-panel">
      <div className="office-panel-heading">
        <div>
          <span className="office-eyebrow">YOUR REGIONAL MEDIA</span>
          <h2>Photo library</h2>
        </div>
        <label className="office-upload compact">
          {busy ? "Uploading…" : "+ Upload photograph"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={upload}
          />
        </label>
      </div>
      <p className="office-muted">
        New uploads stay private until they are used by a published item. Copy
        an image reference and paste it into any content photograph field.
      </p>
      {busy && (
        <progress
          value={progress}
          max="100"
          aria-label="Photograph upload progress"
        />
      )}
      <Notice error>{error}</Notice>
      {error && (
        <button className="office-secondary" onClick={() => load()}>
          Try again
        </button>
      )}
      {loading && <p role="status">Loading photographs…</p>}
      {!loading && !files.length && !error && (
        <div className="office-empty">
          <h3>Your photographs belong here.</h3>
          <p>
            Upload your first image, or add one while editing a programme,
            announcement, or gallery item.
          </p>
        </div>
      )}
      <div className="office-media-grid">
        {files.map((file) => (
          <article key={file.id}>
            <img src={file.url} alt="Uploaded regional media" loading="lazy" />
            <div>
              <small>{Math.round((file.metadata?.size || 0) / 1024)} KB</small>
              <button
                className="office-secondary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(file.reference);
                    notify(
                      "Image reference copied. Paste it into a photograph field.",
                    );
                  } catch {
                    window.prompt("Copy this image reference:", file.reference);
                  }
                }}
              >
                Copy reference
              </button>
              <button
                className="office-text-button danger"
                disabled={busy}
                onClick={() => remove(file)}
              >
                Delete photograph
              </button>
            </div>
          </article>
        ))}
      </div>
      {hasMore && (
        <button
          className="office-secondary"
          disabled={loading}
          onClick={() => load(true)}
        >
          Load more photographs
        </button>
      )}
    </section>
  );
}
function Dashboard({ onLogout }) {
  const [section, setSection] = useState("overview");
  const [content, setContent] = useState({ items: [], settings: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editor, setEditor] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState(false);
  async function load() {
    setLoading(true);
    setError("");
    try {
      setContent(await getAdminContent());
    } catch {
      setError(
        "We could not load the church content. Check your connection or ask the website owner to check the content service.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  function navigate(next) {
    if (
      editor &&
      !window.confirm(
        "Close this editor? Changes you have not saved will be lost.",
      )
    )
      return;
    setSection(next);
    setEditor(null);
    setSearch("");
    setStatus("all");
    setNotice("");
  }
  function create(kind) {
    setSection(kind);
    setEditor(blankItem(kind));
    setNotice("");
  }
  async function saved() {
    setEditor(null);
    setNotice(
      "Your update has been saved. Published content is now available on the website.",
    );
    await load();
  }
  async function publish(item) {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await setPublished(item, !item.published);
      setNotice(item.published ? "Item moved to drafts." : "Item published.");
      await load();
    } catch (e) {
      setError(e.message || "Could not update this item.");
    } finally {
      setBusy(false);
    }
  }
  async function remove(item) {
    if (
      !window.confirm(
        `Delete “${item.title}”? This cannot be undone. Its photograph will remain in the media library.`,
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await deleteItem(item.id);
      await load();
      setNotice("Item deleted.");
    } catch {
      setError("Could not delete this item. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const items = content.items.filter(
    (i) =>
      i.kind === section &&
      (status === "all" || i.published === (status === "published")) &&
      `${i.title} ${i.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <div className="office-shell">
      <aside className="office-sidebar">
        <Brand />
        <span className="office-sidebar-label">YOUR WORKSPACE</span>
        <nav aria-label="Church office navigation">
          <button
            className={section === "overview" ? "selected" : ""}
            onClick={() => navigate("overview")}
          >
            Overview<span>01</span>
          </button>
          {KINDS.map((kind, i) => (
            <button
              key={kind}
              className={section === kind ? "selected" : ""}
              onClick={() => navigate(kind)}
            >
              {sections[kind][0]}
              <span>{String(i + 2).padStart(2, "0")}</span>
            </button>
          ))}
          <div className="office-nav-divider" />
          <button
            className={section === "settings" ? "selected" : ""}
            onClick={() => navigate("settings")}
          >
            Page text & contact
          </button>
          <button
            className={section === "media" ? "selected" : ""}
            onClick={() => navigate("media")}
          >
            Photo library
          </button>
        </nav>
        <div className="office-sidebar-bottom">
          <a href="/" target="_blank" rel="noopener noreferrer">
            View website <Arrow />
          </a>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </aside>
      <div className="office-workspace">
        <header className="office-topbar">
          <span>
            CHURCH OFFICE <b>/</b>{" "}
            {sections[section]?.[0] ||
              (section === "settings"
                ? "Page text & contact"
                : section === "media"
                  ? "Photo library"
                  : "Overview")}
          </span>
          <span className="office-staff-status">
            <i />
            Approved staff access
          </span>
        </header>
        <main className="office-main">
          <div className="office-welcome">
            <div>
              <span className="office-eyebrow">
                SW8 MEGA REGION · IJEBU / REMO
              </span>
              <h1>
                {section === "overview"
                  ? "Good work starts here."
                  : sections[section]?.[0] ||
                    (section === "settings"
                      ? "Make it your own."
                      : "Every picture, a story.")}
              </h1>
              <p>Keep our church family informed, connected, and welcome.</p>
            </div>
            {sections[section] && !editor && (
              <button
                className="office-primary"
                onClick={() => create(section)}
              >
                + Add {sections[section][1]}
              </button>
            )}
          </div>
          <Notice>{notice}</Notice>
          <Notice error>{error}</Notice>
          {error && (
            <button className="office-secondary" onClick={load}>
              Try loading again
            </button>
          )}
          {loading && (
            <div className="office-loading" role="status">
              <div />
              <p>Opening your workspace…</p>
            </div>
          )}
          {!loading && section === "overview" && (
            <>
              <div className="office-stats">
                {[
                  [
                    "event",
                    "Upcoming programmes",
                    content.items.filter(
                      (i) =>
                        i.kind === "event" &&
                        i.published &&
                        i.date >=
                          new Date().toLocaleDateString("en-CA", {
                            timeZone: "Africa/Lagos",
                          }),
                    ).length,
                  ],
                  [
                    "sermon",
                    "Published messages",
                    content.items.filter(
                      (i) => i.kind === "sermon" && i.published,
                    ).length,
                  ],
                  [
                    "announcement",
                    "Announcements",
                    content.items.filter(
                      (i) => i.kind === "announcement" && i.published,
                    ).length,
                  ],
                  [
                    "gallery",
                    "Gallery photographs",
                    content.items.filter(
                      (i) => i.kind === "gallery" && i.published,
                    ).length,
                  ],
                ].map(([kind, label, count]) => (
                  <button key={kind} onClick={() => navigate(kind)}>
                    <span>{label}</span>
                    <strong>{count}</strong>
                    <small>
                      Manage {sections[kind][0].toLowerCase()} <Arrow />
                    </small>
                  </button>
                ))}
              </div>
              <section className="office-panel">
                <div className="office-panel-heading">
                  <div>
                    <span className="office-eyebrow">A FEW SIMPLE STEPS</span>
                    <h2>What would you like to share?</h2>
                  </div>
                </div>
                <div className="office-quick-actions">
                  {["event", "announcement", "sermon", "gallery"].map(
                    (kind) => (
                      <button key={kind} onClick={() => create(kind)}>
                        <span>+</span>
                        <strong>Add {sections[kind][1]}</strong>
                        <small>Create a draft, preview, then publish.</small>
                        <Arrow />
                      </button>
                    ),
                  )}
                </div>
              </section>
              <section className="office-guidance">
                <span>01</span>
                <div>
                  <h3>Draft first. Publish when ready.</h3>
                  <p>
                    Your public website shows only published content. Keep
                    names, dates, and contact information confirmed before
                    sharing.
                  </p>
                </div>
                <a href="/" target="_blank" rel="noopener noreferrer">
                  View website <Arrow />
                </a>
              </section>
            </>
          )}
          {!loading && editor && (
            <ContentEditor
              key={editor.id || editor.kind}
              item={editor}
              onSaved={saved}
              onCancel={() => {
                if (
                  window.confirm(
                    "Close this editor? Unsaved changes will be lost.",
                  )
                )
                  setEditor(null);
              }}
            />
          )}
          {!loading && !editor && sections[section] && (
            <section className="office-panel">
              <div className="office-list-tools">
                <label>
                  Search {sections[section][0].toLowerCase()}
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title or description"
                  />
                </label>
                <label>
                  Show
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="all">All items</option>
                    <option value="published">Published</option>
                    <option value="drafts">Drafts</option>
                  </select>
                </label>
              </div>
              {!items.length ? (
                <div className="office-empty">
                  <span>+</span>
                  <h3>
                    {search || status !== "all"
                      ? "No matching items."
                      : `Your first ${sections[section][1]} starts here.`}
                  </h3>
                  <p>
                    {search || status !== "all"
                      ? "Try another search or filter."
                      : "Add confirmed details, save a draft, and publish when you are ready."}
                  </p>
                  {!search && status === "all" && (
                    <button
                      className="office-primary"
                      onClick={() => create(section)}
                    >
                      Add {sections[section][1]}
                      <Arrow />
                    </button>
                  )}
                </div>
              ) : (
                <div className="office-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Date / day</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.title}</strong>
                            {item.featured && <small>Featured</small>}
                          </td>
                          <td>
                            <span
                              className={`office-pill ${item.published ? "published" : ""}`}
                            >
                              {item.published ? "Published" : "Draft"}
                            </span>
                          </td>
                          <td>{item.date || item.category || "—"}</td>
                          <td>
                            <div className="office-row-actions">
                              <button onClick={() => setEditor(item)}>
                                Edit
                              </button>
                              <button
                                disabled={busy}
                                onClick={() => publish(item)}
                              >
                                {item.published ? "Unpublish" : "Publish"}
                              </button>
                              <button
                                className="danger"
                                disabled={busy}
                                onClick={() => remove(item)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {!loading && section === "settings" && (
            <SettingsEditor
              key={
                content.settings.updated_at || JSON.stringify(content.settings)
              }
              settings={content.settings}
              onSaved={saved}
            />
          )}{" "}
          {section === "media" && <MediaLibrary notify={setNotice} />}
          <footer className="office-footer">
            MFM SW8 Mega Region, Ijebu/Remo{" "}
            <span>Content with care. Community with purpose.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(isConfigured);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState("");
  const [authReady, setAuthReady] = useState(!isConfigured);
  const identityRef = useRef(null);
  const [passwordIntent, setPasswordIntent] = useState(officeAuthLink.intent);
  const [linkError, setLinkError] = useState(officeAuthLink.error);
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let observedEvent = false;
    function accept(next) {
      if (!active) return;
      const identity = next ? `${next.user.id}:${next.access_token}` : "";
      if (identityRef.current !== identity) {
        identityRef.current = identity;
        setApproved(false);
        setChecking(!!next);
      }
      setSession(next);
      setAuthReady(true);
    }
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!observedEvent && active) {
          accept(data.session);
          if (error) {
            setLinkError(!!officeAuthLink.intent);
            setError("We could not restore your sign-in. Please try again.");
          }
        }
        clearOfficeAuthFragment();
      })
      .catch(() => {
        if (!observedEvent && active) {
          accept(null);
          setLinkError(!!officeAuthLink.intent);
          setError("We could not restore your sign-in. Please try again.");
        }
        clearOfficeAuthFragment();
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      observedEvent = true;
      if (event === "PASSWORD_RECOVERY") setPasswordIntent("recovery");
      if (event === "SIGNED_OUT") setPasswordIntent(null);
      accept(next);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    if (!authReady) return;
    if (!session) {
      setApproved(false);
      setChecking(false);
      return;
    }
    if (passwordIntent) {
      setApproved(false);
      setChecking(false);
      return;
    }
    setChecking(true);
    setError("");
    isAdmin()
      .then((ok) => {
        if (active) setApproved(ok);
      })
      .catch(() => {
        if (active)
          setError(
            "We could not confirm access. Check your connection and try signing in again.",
          );
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [authReady, session?.user?.id, session?.access_token, passwordIntent]);
  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError("Sign out could not complete. Please try again.");
      return false;
    }
    setSession(null);
    setApproved(false);
    setPasswordIntent(null);
    setLinkError(false);
    clearOfficeAuthFragment();
    return true;
  }
  if (!isConfigured) return <Setup />;
  if (checking)
    return (
      <Screen title="Opening your workspace…">
        <p role="status">Checking your approved staff account.</p>
      </Screen>
    );
  if (!session) return <Login linkError={linkError || !!passwordIntent} />;
  if (passwordIntent)
    return (
      <SetPassword
        intent={passwordIntent}
        email={session.user.email}
        onSignOut={logout}
      />
    );
  if (!approved)
    return (
      <Screen title="Staff access needed.">
        <Notice error>{error}</Notice>
        <p>
          This account does not have approved access to the church office. Ask
          the website owner to add your account to the approved staff list.
        </p>
        <button className="office-primary" onClick={logout}>
          Sign out
        </button>
      </Screen>
    );
  return (
    <>
      <Notice error>{error}</Notice>
      <Dashboard onLogout={logout} />
    </>
  );
}
createRoot(document.getElementById("admin-root")).render(<App />);
