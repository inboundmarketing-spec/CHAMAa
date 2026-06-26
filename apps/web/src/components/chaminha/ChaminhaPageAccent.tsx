import { ChaminhaLogo } from './ChaminhaLogo';

type Props = {
  size?: number;
  variant?: 'inline' | 'corner';
  className?: string;
};

export function ChaminhaPageAccent({
  size = 48,
  variant = 'inline',
  className = '',
}: Props) {
  return (
    <span
      className={`chaminha-page-accent chaminha-page-accent--${variant}${className ? ` ${className}` : ''}`}
      aria-hidden
    >
      <ChaminhaLogo size={size} className="chaminha-page-accent-logo" />
    </span>
  );
}
