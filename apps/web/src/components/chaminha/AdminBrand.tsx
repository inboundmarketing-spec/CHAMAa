import { ChaminhaLogo } from './ChaminhaLogo';

type Props = {
  as?: 'h1' | 'h2';
  className?: string;
  logoSize?: number;
};

export function AdminBrand({ as: Tag = 'h2', className = '', logoSize = 32 }: Props) {
  return (
    <Tag className={`admin-brand-row${className ? ` ${className}` : ''}`}>
      <ChaminhaLogo size={logoSize} priority />
      <span className="admin-brand-text">
        O <span>Inter</span>
      </span>
    </Tag>
  );
}
