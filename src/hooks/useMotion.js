import { useEffect } from "react";
export function useMotion(root) {
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup = () => {},
      disposed = false;
    const setup = async () => {
      cleanup();
      if (mq.matches) return;
      const { gsap } = await import("gsap");
      if (disposed || mq.matches || !root.current) return;
      const ctx = gsap.context(() => {
        gsap.from(".hero-enter", {
          y: 24,
          opacity: 0,
          duration: 0.8,
          stagger: 0.11,
          ease: "power3.out",
        });
        gsap.from(".hero-visual", {
          y: 24,
          rotation: 1.5,
          opacity: 0,
          duration: 1.2,
          ease: "power3.out",
          delay: 0.2,
        });
      }, root.current);
      const hero = root.current.querySelector(".hero"),
        visual = root.current.querySelector(".hero-visual");
      const pointer = matchMedia(
        "(hover: hover) and (pointer: fine) and (min-width: 1000px)",
      );
      const move = (e) => {
        if (!pointer.matches || !visual) return;
        const r = hero.getBoundingClientRect();
        gsap.to(visual, {
          x: (e.clientX - r.left - r.width / 2) * 0.009,
          y: (e.clientY - r.top - r.height / 2) * 0.012,
          duration: 1,
          ease: "power2.out",
          overwrite: "auto",
        });
      };
      const leave = () => {
        if (visual)
          gsap.to(visual, { x: 0, y: 0, duration: 0.8, overwrite: "auto" });
      };
      hero?.addEventListener("pointermove", move);
      hero?.addEventListener("pointerleave", leave);
      cleanup = () => {
        hero?.removeEventListener("pointermove", move);
        hero?.removeEventListener("pointerleave", leave);
        ctx.revert();
      };
    };
    setup();
    mq.addEventListener("change", setup);
    return () => {
      disposed = true;
      cleanup();
      mq.removeEventListener("change", setup);
    };
  }, [root]);
}
