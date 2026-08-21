import { useEffect, useRef, useState, useCallback } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import './DecryptedText.css';

const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * DecryptedText — a "decoding" scramble-to-reveal effect reserved for
 * BeefTrace's technology/verification identity: batch IDs, tracking IDs,
 * QR/verification status, digital certificate references. Not for
 * ordinary paragraphs.
 */
export default function DecryptedText({
  text,
  speed = 35,
  maxIterations = 8,
  sequential = true,
  revealDirection = 'start', // 'start' | 'end' | 'center'
  useOriginalCharsOnly = true,
  animateOn = 'view', // 'view' | 'hover' | 'click' | 'in-view-hover'
  charset = DEFAULT_CHARSET,
  as: Tag = 'span',
  className = '',
  monospace = true,
}) {
  const [display, setDisplay] = useState(text);
  const [inView, setInView] = useState(animateOn !== 'view');
  const containerRef = useRef(null);
  const intervalRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  const pool = computeCharPool(text, charset, useOriginalCharsOnly);

  const runDecrypt = useCallback(() => {
    if (reducedMotion || !text) return;
    clearInterval(intervalRef.current);
    const len = text.length;
    const order = buildRevealOrder(len, revealDirection);
    const revealedCount = new Array(len).fill(0);
    let tick = 0;
    const totalTicks = sequential ? len + maxIterations : maxIterations;

    intervalRef.current = setInterval(() => {
      tick += 1;
      const settledUpTo = sequential
        ? Math.max(0, tick - maxIterations)
        : tick >= maxIterations
        ? len
        : 0;

      const next = text.split('').map((ch, i) => {
        if (ch === ' ') return ' ';
        const positionInOrder = order.indexOf(i);
        const isSettled = sequential ? positionInOrder < settledUpTo : tick >= maxIterations;
        if (isSettled) return ch;
        revealedCount[i] += 1;
        return pool[Math.floor(Math.random() * pool.length)] || ch;
      });
      setDisplay(next.join(''));

      if (tick >= totalTicks) {
        clearInterval(intervalRef.current);
        setDisplay(text);
      }
    }, speed);
  }, [text, speed, maxIterations, sequential, revealDirection, pool, reducedMotion]);

  useEffect(() => {
    if (animateOn === 'view') {
      const el = containerRef.current;
      if (!el || !('IntersectionObserver' in window)) {
        setInView(true);
        return undefined;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setInView(true);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.4 }
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
    return undefined;
  }, [animateOn]);

  useEffect(() => {
    if (animateOn !== 'view' || !inView || reducedMotion) return undefined;
    runDecrypt();
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, animateOn, reducedMotion]);

  const handlers = {};
  if (animateOn === 'hover' || animateOn === 'in-view-hover') {
    handlers.onMouseEnter = runDecrypt;
  }
  if (animateOn === 'click') {
    handlers.onClick = runDecrypt;
  }

  return (
    <Tag
      ref={containerRef}
      className={`rb-decrypted-text ${monospace ? 'rb-decrypted-text--mono' : ''} ${className}`}
      aria-label={text}
      {...handlers}
    >
      {display}
    </Tag>
  );
}

function computeCharPool(text, charset, useOriginalCharsOnly) {
  if (useOriginalCharsOnly) {
    const unique = Array.from(new Set((text || '').replace(/\s/g, '').split('')));
    return unique.length ? unique : charset.split('');
  }
  return charset.split('');
}

function buildRevealOrder(len, direction) {
  const indices = Array.from({ length: len }, (_, i) => i);
  if (direction === 'end') return indices.slice().reverse();
  if (direction === 'center') {
    const mid = (len - 1) / 2;
    return indices.slice().sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  }
  return indices; // 'start'
}
