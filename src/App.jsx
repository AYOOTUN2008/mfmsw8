import { lazy, Suspense } from "react";
import { ContentProvider, useContent } from "./hooks/useContent.jsx";
import { Header, Footer, Meta } from "./components/Layout.jsx";
import { LinkButton } from "./components/UI.jsx";
import { pages } from "./data/site.js";
const routes = {
  "/": lazy(() => import("./pages/Home.jsx")),
  "/about": lazy(() => import("./pages/About.jsx")),
  "/services": lazy(() => import("./pages/Services.jsx")),
  "/events": lazy(() => import("./pages/Events.jsx")),
  "/messages": lazy(() => import("./pages/Messages.jsx")),
  "/ministries": lazy(() => import("./pages/Ministries.jsx")),
  "/media": lazy(() => import("./pages/Media.jsx")),
  "/contact": lazy(() => import("./pages/Contact.jsx")),
};
function ContentNotice() {
  const { status } = useContent();
  return status === "unavailable" ? (
    <div className="content-notice" role="status">
      Some regional updates are temporarily unavailable. Please try again
      shortly.
    </div>
  ) : null;
}
export default function App() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  const Page = routes[path];
  return (
    <ContentProvider>
      <Meta path={path} />
      <Header />
      <main id="main-content">
        <ContentNotice />
        <Suspense
          fallback={
            <div className="page-loading" role="status">
              Opening {pages[path]?.title || "the regional website"}…
            </div>
          }
        >
          {Page ? (
            <Page />
          ) : (
            <section className="section">
              <div className="container">
                <h1>Let’s find your way.</h1>
                <p>This page is not part of our regional website.</p>
                <LinkButton href="/">Return home</LinkButton>
              </div>
            </section>
          )}
        </Suspense>
      </main>
      <Footer />
    </ContentProvider>
  );
}
