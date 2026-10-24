import { createContext, useContext, useEffect, useState } from "react";
import { getPublicContent, isConfigured } from "../services/content.js";
import { defaults, localItems } from "../data/site.js";
const ContentContext = createContext(null);
export function ContentProvider({ children }) {
  const [content, setContent] = useState({
    settings: defaults,
    items: isConfigured ? [] : localItems,
    status: isConfigured ? "loading" : "local",
  });
  useEffect(() => {
    if (!isConfigured) return;
    let active = true;
    getPublicContent()
      .then((data) => {
        if (active)
          setContent({
            settings: {
              ...defaults,
              ...Object.fromEntries(
                Object.entries(data.settings || {}).filter(
                  ([, v]) => typeof v === "string" && v.trim(),
                ),
              ),
            },
            items: data.items || [],
            status: "live",
          });
      })
      .catch(() => {
        if (active)
          setContent({ settings: defaults, items: [], status: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <ContentContext.Provider value={content}>
      {children}
    </ContentContext.Provider>
  );
}
export function useContent() {
  return useContext(ContentContext);
}
export function useItems(kind) {
  return useContent().items.filter(
    (item) => item.kind === kind && item.published,
  );
}
