import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import './TextType.css';

/**
 * TextType — a typewriter-style component for dynamic, non-critical
 * operational messaging (subtitles, status lines, empty states).
 *
 * Accepts a single string (typed once) or an array of strings
 * (typed, held, deleted, and cycled).
 */
export default function TextType({
  text,
  typingSpeed = 45,
  deletingSpeed = 25,
  pauseDuration = 1800,
  loop = true,
  cursor = true,
  as: Tag = 'span',
  className = '',
}) {
  const messages = Array.isArray(text) ? text : [text];
  const reducedMotion = usePrefersReducedMotion();

  const [msgIndex, setMsgIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [phase, setPhase] = useState('typing'); // typing | pausing | deleting
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) return undefined;

    const current = messages[msgIndex] ?? '';

    if (phase === 'typing') {
      if (display.length < current.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplay(current.slice(0, display.length + 1));
        }, typingSpeed);
      } else {
        const canCycle = loop && messages.length > 1;
        if (canCycle) {
          timeoutRef.current = setTimeout(() => setPhase('deleting'), pauseDuration);
        }
      }
    } else if (phase === 'deleting') {
      timeoutRef.current = setTimeout(() => {
        if (display.length > 0) {
          setDisplay(current.slice(0, display.length - 1));
        } else {
          setMsgIndex((idx) => (idx + 1) % messages.length);
          setPhase('typing');
        }
      }, deletingSpeed);
    }

    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display, phase, msgIndex, reducedMotion]);

  const shownText = reducedMotion ? messages[0] ?? '' : display;

  return (
    <Tag className={`rb-text-type ${className}`}>
      <span aria-live="polite">{shownText}</span>
      {cursor && !reducedMotion && <span className="rb-text-type__cursor" aria-hidden="true" />}
    </Tag>
  );
}
