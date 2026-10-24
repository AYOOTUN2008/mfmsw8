import { useEffect } from "react";

export function useMotion(root) {
  useEffect(() => {
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let context;
    let generation = 0;
    let disposed = false;
    const setup = async () => {
      const current = ++generation;
      context?.revert();
      if (preference.matches) return;
      const { gsap } = await import("gsap");
      if (
        disposed ||
        current !== generation ||
        preference.matches ||
        !root.current
      )
        return;
      context = gsap.context(() => {
        gsap.from(".hero-enter", {
          y: 18,
          opacity: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
        });
      }, root.current);
    };
    setup();
    preference.addEventListener("change", setup);
    return () => {
      disposed = true;
      context?.revert();
      preference.removeEventListener("change", setup);
    };
  }, [root]);
}
