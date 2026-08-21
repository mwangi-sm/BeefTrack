import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import './StrokeText.css';

/**
 * StrokeText — an SVG hero title that "draws" its outline in, then wipes
 * a solid fill across the letters.
 *
 * Note: GSAP's DrawSVGPlugin is a paid Club GreenSock add-on, so the
 * "draw" feel here is approximated with a per-character stroke reveal
 * (stagger + opacity/scale) rather than an actual stroke-dashoffset path
 * animation. Visually reads the same for typography use cases.
 */
export default function StrokeText({
  text,
  strokeColor = 'var(--gold-600, #D4AF37)',
  fillColor = 'var(--cream-50, #FFFFFF)',
  strokeWidth = 1.4,
  drawDuration = 1.2,
  fillDelay = 0.15,
  stagger = 0.035,
  ease = 'power2.out',
  trigger = 'mount', // 'mount' | 'view'
  fillMode = 'wipe', // 'wipe' | 'fade'
  fontSize = 72,
  fontWeight = 800,
  letterSpacing = -2,
  as: Tag = 'h1',
  className = '',
  ariaLabel,
}) {
  const containerRef = useRef(null);
  const strokeCharsRef = useRef([]);
  const fillRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  const chars = useMemo(() => Array.from(text ?? ''), [text]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const strokeChars = strokeCharsRef.current.filter(Boolean);
    const fillEl = fillRef.current;

    if (reducedMotion) {
      gsap.set(strokeChars, { opacity: 1, scale: 1 });
      if (fillEl) gsap.set(fillEl, { clipPath: 'inset(0 0% 0 0)', opacity: 1 });
      return undefined;
    }

    const runAnimation = () => {
      const tl = gsap.timeline();
      tl.set(strokeChars, { opacity: 0, scale: 0.85, transformOrigin: '50% 100%' });
      if (fillEl) {
        gsap.set(fillEl, {
          clipPath: fillMode === 'wipe' ? 'inset(0 100% 0 0)' : 'inset(0 0 0 0)',
          opacity: fillMode === 'wipe' ? 1 : 0,
        });
      }
      tl.to(strokeChars, {
        opacity: 1,
        scale: 1,
        duration: drawDuration,
        ease,
        stagger,
      });
      if (fillEl) {
        if (fillMode === 'wipe') {
          tl.to(
            fillEl,
            { clipPath: 'inset(0 0% 0 0)', duration: drawDuration * 0.9, ease },
            fillDelay
          );
        } else {
          tl.to(fillEl, { opacity: 1, duration: drawDuration * 0.6, ease }, fillDelay);
        }
      }
      return tl;
    };

    if (trigger === 'view' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runAnimation();
              observer.disconnect();
            }
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(container);
      return () => observer.disconnect();
    }

    const tl = runAnimation();
    return () => tl && tl.kill();
  }, [chars, drawDuration, fillDelay, stagger, ease, trigger, fillMode, reducedMotion]);

  const sharedTextStyle = {
    fontSize,
    fontWeight,
    letterSpacing,
  };

  return (
    <Tag
      ref={containerRef}
      className={`rb-stroke-text ${className}`}
      style={{ position: 'relative', display: 'inline-block', lineHeight: 1.05 }}
      aria-label={ariaLabel ?? text}
    >
      {/* Visually-hidden accessible text so screen readers get real content
          even though the visible glyphs are decorative spans/SVG-styled. */}
      <span className="rb-stroke-text__sr-only">{text}</span>

      <span aria-hidden="true" className="rb-stroke-text__visual" style={sharedTextStyle}>
        <span className="rb-stroke-text__stroke-layer" style={{ WebkitTextStroke: `${strokeWidth}px ${strokeColor}`, color: 'transparent' }}>
          {chars.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              ref={(el) => (strokeCharsRef.current[i] = el)}
              className="rb-stroke-text__char"
              style={{ display: 'inline-block' }}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </span>
        <span
          ref={fillRef}
          className="rb-stroke-text__fill-layer"
          style={{ color: fillColor }}
        >
          {text}
        </span>
      </span>
    </Tag>
  );
}
