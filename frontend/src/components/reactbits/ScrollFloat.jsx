import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import './ScrollFloat.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * ScrollFloat — reveals a heading's characters with a gentle float-up
 * as the section scrolls into view. Intended for major section titles
 * further down a dashboard (Inventory, Traceability Timeline, etc.),
 * not for every card.
 */
export default function ScrollFloat({
  text,
  tag = 'h2',
  animationDuration = 0.8,
  ease = 'power3.out',
  stagger = 0.025,
  scrollStart = 'center bottom+=20%',
  scrollEnd = 'bottom bottom-=30%',
  textClassName = '',
  className = '',
}) {
  const containerRef = useRef(null);
  const charsRef = useRef([]);
  const reducedMotion = usePrefersReducedMotion();
  const Tag = tag;

  const chars = useMemo(() => Array.from(text ?? ''), [text]);

  useEffect(() => {
    const container = containerRef.current;
    const els = charsRef.current.filter(Boolean);
    if (!container || els.length === 0) return undefined;

    if (reducedMotion) {
      gsap.set(els, { opacity: 1, y: 0 });
      return undefined;
    }

    gsap.set(els, { opacity: 0, y: '60%' });

    const tween = gsap.to(els, {
      opacity: 1,
      y: '0%',
      duration: animationDuration,
      ease,
      stagger,
      scrollTrigger: {
        trigger: container,
        start: scrollStart,
        end: scrollEnd,
        scrub: false,
        toggleActions: 'play none none none',
        once: true,
      },
    });

    return () => {
      tween.scrollTrigger && tween.scrollTrigger.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chars, reducedMotion]);

  return (
    <Tag ref={containerRef} className={`rb-scroll-float ${textClassName} ${className}`}>
      {chars.map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          ref={(el) => (charsRef.current[i] = el)}
          className="rb-scroll-float__char"
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </Tag>
  );
}
