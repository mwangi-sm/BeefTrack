import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import './SplitText.css';

/**
 * SplitText — splits text into characters, words, or lines and reveals
 * them with a subtle staggered animation the first time the element
 * enters the viewport.
 */
export default function SplitText({
  text,
  tag = 'p',
  splitType = 'words', // 'chars' | 'words' | 'lines'
  delay = 35, // ms between each unit
  duration = 0.55,
  ease = 'power3.out',
  from = { opacity: 0, y: 20 },
  to = { opacity: 1, y: 0 },
  threshold = 0.15,
  rootMargin = '-80px',
  textAlign = 'left',
  className = '',
}) {
  const containerRef = useRef(null);
  const unitsRef = useRef([]);
  const hasAnimated = useRef(false);
  const reducedMotion = usePrefersReducedMotion();
  const Tag = tag;

  const units = useMemo(() => {
    if (!text) return [];
    if (splitType === 'chars') return Array.from(text);
    if (splitType === 'lines') return text.split('\n');
    return text.split(' ');
  }, [text, splitType]);

  useEffect(() => {
    const container = containerRef.current;
    const els = unitsRef.current.filter(Boolean);
    if (!container || els.length === 0) return undefined;

    if (reducedMotion) {
      gsap.set(els, { opacity: 1, x: 0, y: 0 });
      return undefined;
    }

    gsap.set(els, from);

    const animate = () => {
      if (hasAnimated.current) return;
      hasAnimated.current = true;
      gsap.to(els, {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
      });
    };

    if (!('IntersectionObserver' in window)) {
      animate();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate();
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin }
    );
    observer.observe(container);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, reducedMotion]);

  const joiner = splitType === 'lines' ? '\n' : ' ';

  return (
    <Tag
      ref={containerRef}
      className={`rb-split-text rb-split-text--${splitType} ${className}`}
      style={{ textAlign }}
    >
      {units.map((unit, i) => (
        <span key={`${unit}-${i}`} className="rb-split-text__unit-wrap">
          <span
            ref={(el) => (unitsRef.current[i] = el)}
            className="rb-split-text__unit"
          >
            {unit}
          </span>
          {i < units.length - 1 ? joiner : ''}
        </span>
      ))}
    </Tag>
  );
}
