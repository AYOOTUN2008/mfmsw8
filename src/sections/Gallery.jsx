import { useState } from "react";
import { useItems } from "../hooks/useContent.jsx";
import { imageUrl, EmptyState } from "../components/UI.jsx";
import Icon from "../components/Icon.jsx";
import MediaDialog from "../components/MediaDialog.jsx";
export default function Gallery({ limit }) {
  const gallery = useItems("gallery")
    .filter((item) => imageUrl(item.image_url))
    .slice(0, limit);
  const [media, setMedia] = useState(null);
  if (!gallery.length)
    return (
      <EmptyState icon="image" title="Our regional album is being prepared">
        New photographs will appear here as they are published.
      </EmptyState>
    );
  return (
    <>
      <div className="gallery-grid">
        {gallery.map((item, i) => (
          <figure key={item.id}>
            <button
              className="gallery-image"
              onClick={() =>
                setMedia({
                  type: "image",
                  src: item.image_url,
                  title: item.title,
                  description: item.description,
                })
              }
              aria-label={`View photo: ${item.title}`}
            >
              <img
                src={imageUrl(item.image_url)}
                loading="lazy"
                width="1000"
                height="563"
                alt={item.description || item.title}
              />
              <span>
                <Icon name="upRight" size={22} />
              </span>
            </button>
            <figcaption>
              <span>
                0{i + 1} / {item.category || "REGIONAL FAMILY"}
              </span>
              <h3>{item.title}</h3>
            </figcaption>
          </figure>
        ))}
      </div>
      <MediaDialog media={media} onClose={() => setMedia(null)} />
    </>
  );
}
