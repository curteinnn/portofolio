import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export default function PortfolioInformationOverlay({ item, onClose }) {
  const rootRef = useRef(null);
  const itemId = item?.id;

  useLayoutEffect(() => {
    if (!itemId || !rootRef.current) return undefined;
    const context = gsap.context(() => {
      gsap.fromTo(
        "[data-editorial-reveal]",
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.11,
          clearProps: "transform",
        },
      );
    }, rootRef);
    return () => context.revert();
  }, [itemId]);

  if (!item) return null;

  return (
    <section
      ref={rootRef}
      className={`portfolio-editorial portfolio-editorial--${item.layout ?? "default"}`}
      aria-live="polite"
      aria-label={`${item.title} information`}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
        else event.stopPropagation();
      }}
    >
      <span
        className="editorial-index"
        data-editorial-reveal
        aria-hidden="true"
      >
        {item.tag?.slice(0, 2)}
      </span>
      <span className="editorial-kicker" data-editorial-reveal>
        {item.tag}
      </span>
      <h1 className="editorial-title" data-editorial-reveal>
        {item.title}
      </h1>
      <p className="editorial-description" data-editorial-reveal>
        {item.description ?? item.text}
      </p>
      <span className="editorial-note" data-editorial-reveal>
        {item.note ?? "ALDRY DIAN RENO · WEB DEVELOPER"}
      </span>
      <span
        className="editorial-orbit"
        data-editorial-reveal
        aria-hidden="true"
      />
      <button
        className="editorial-close"
        type="button"
        aria-label="Close information"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        <span aria-hidden="true">×</span>
        <span>BACK TO SCENE</span>
      </button>
    </section>
  );
}
