interface Props {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Generate a consistent hue from name
function getHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export default function AvatarCircle({ name, size = 'md', className = '' }: Props) {
  const initials = getInitials(name);
  const hue = getHue(name);

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold font-sans shrink-0 ${className}`}
      style={{
        background: `hsl(${hue}, 55%, 30%)`,
        color: `hsl(${hue}, 70%, 85%)`,
        border: '2px solid',
        borderColor: `hsl(${hue}, 55%, 45%)`,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
