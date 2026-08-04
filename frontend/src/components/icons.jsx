import { IconPaths } from './IconPaths';

export { IconPaths };

export function Icon({ children, size = 18, style, className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      style={{ width: size, height: size, ...style }}
    >
      {children}
    </svg>
  )
}

