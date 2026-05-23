import type { EventTag } from '../../types';

interface Props {
  tag: EventTag;
  size?: 'sm' | 'md';
  active?: boolean;
  onClick?: () => void;
}

const tagConfig: Record<EventTag, { label: string; color: string }> = {
  tech:     { label: 'Tech',     color: 'tag-tech'     },
  cultural: { label: 'Cultural', color: 'tag-cultural' },
  sports:   { label: 'Sports',   color: 'tag-sports'   },
  academic: { label: 'Academic', color: 'tag-academic' },
  workshop: { label: 'Workshop', color: 'tag-workshop' },
};

export default function TagChip({ tag, size = 'sm', active, onClick }: Props) {
  const config = tagConfig[tag];
  const isClickable = !!onClick;

  return (
    <span
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter') onClick(); } : undefined}
      className={`tag-chip ${config.color} ${size === 'md' ? 'text-sm px-3 py-1.5' : ''} 
        ${isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
        ${active ? 'ring-2 ring-current ring-offset-1 ring-offset-[var(--bg)]' : ''}
      `}
    >
      {config.label}
    </span>
  );
}

export { tagConfig };
