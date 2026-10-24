import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";
import { imageUrl } from "./UI.jsx";
export default function MediaDialog({ media, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (media) {
      ref.current.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [media]);
  return (
    <dialog
      ref={ref}
      className="media-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) ref.current.close();
      }}
      aria-labelledby="media-title"
    >
      <div className="dialog-header">
        <h2 id="media-title">{media?.title}</h2>
        <button
          aria-label="Close media"
          className="icon-button"
          onClick={() => ref.current.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      {media &&
        (media.type === "video" ? (
          <video
            key={media.src}
            controls
            playsInline
            preload="metadata"
            poster={media.poster}
            aria-label={media.title}
          >
            <source src={media.src} type="video/mp4" />
            Video playback is unavailable in your browser.
          </video>
        ) : (
          <img
            src={imageUrl(media.src)}
            alt={media.description || media.title}
          />
        ))}
      {media?.description && <p>{media.description}</p>}
    </dialog>
  );
}
