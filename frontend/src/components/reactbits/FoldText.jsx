import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import './FoldText.css';

gsap.registerPlugin(ScrollTrigger);

/**
 * FoldText — folds text open from a hinge (top/bottom/left/right) like a
 * page or panel unfolding. Reserved for premium, infrequent moments:
 * first-time dashboard intros, major workflow section headers, large
 * empty states — not ordinary UI copy.
 */
export default function FoldText({
  text,
  tag = 'h2',
  splitBy = 'word', // 'char' | 'word' | 'line'
  hinge = 'top', // 'top' | 'bottom' | 'left' | 'right'
  trigger = 'scroll', // 'scroll' | 'mount'
  duration = 0.65,
  stagger = 0.045,
  ease = 'power3.out',
  perspective = 700,
  creaseShading = 0.45,
  fontSize = 'clamp(2.5rem, 6vw, 5rem)',
  fontWeight = 800,
  color = 'var(--cream-50, #FFFFFF)',
  className = '',
}) {
  const containerRef = useRef(null);
  const unitsRef = useRef([]);
  const reducedMotion = usePrefersReducedMotion();
  const Tag = tag;

  const units = useMemo(() => {
    if (!text) return [];
    if (splitBy === 'char') return Array.from(text);
    if (splitBy === 'line') return text.split('\n');
    return text.split(' ');
  }, [text, splitBy]);

  const rotateAxis = hinge === 'left' || hinge === 'right' ? 'rotateY' : 'rotateX';
  const rotateSign = hinge === 'bottom' || hinge === 'left' ? -1 : 1;
  const transformOrigin =
    hinge === 'top' ? 'top center' : hinge === 'bottom' ? 'bottom center' : hinge === 'left' ? 'left center' : 'right center';

  useEffect(() => {
    const container = containerRef.current;
    const els = unitsRef.current.filter(Boolean);
    if (!container || els.length === 0) return undefined;

    if (reducedMotion) {
      gsap.set(els, { opacity: 1, rotateX: 0, rotateY: 0 });
      return undefined;
    }

    gsap.set(els, {
      opacity: 0,
      [rotateAxis]: rotateSign * 90,
      transformPerspective: perspective,
      transformOrigin,
    });

    const animConfig = {
      opacity: 1,
      [rotateAxis]: 0,
      duration,
      ease,
      stagger,
    };

    let tween;
    if (trigger === 'scroll') {
      tween = gsap.to(els, {
        ...animConfig,
        scrollTrigger: {
          trigger: container,
          start: 'top bottom-=15%',
          once: true,
        },
      });
    } else {
      tween = gsap.to(els, animConfig);
    }

    return () => {
      tween.scrollTrigger && tween.scrollTrigger.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, reducedMotion, trigger]);

  const joiner = splitBy === 'line' ? '\n' : ' ';

  return (
    <Tag
      ref={containerRef}
      className={`rb-fold-text ${className}`}
      style={{ fontSize, fontWeight, color, perspective }}
    >
      {units.map((unit, i) => (
        <span key={`${unit}-${i}`} className="rb-fold-text__wrap">
          <span
            ref={(el) => (unitsRef.current[i] = el)}
            className="rb-fold-text__unit"
            style={{
              boxShadow: `inset 0 -${creaseShading * 6}px ${creaseShading * 10}px -${creaseShading * 8}px rgba(0,0,0,${creaseShading})`,
            }}
          >
            {unit}
          </span>
          {i < units.length - 1 ? joiner : ''}
        </span>
      ))}
    </Tag>
  );
}
