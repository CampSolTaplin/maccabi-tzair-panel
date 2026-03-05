'use client';

import { Camera, User } from 'lucide-react';

interface MemberAvatarProps {
  photoUrl?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showCameraOverlay?: boolean;
}

const SIZES = {
  sm: 'w-7 h-7 text-[0.5rem]',
  md: 'w-9 h-9 text-[0.6rem]',
  lg: 'w-16 h-16 text-sm',
};

export default function MemberAvatar({ photoUrl, name, size = 'sm', onClick, showCameraOverlay }: MemberAvatarProps) {
  const sizeClass = SIZES[size];
  const initials = name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`relative rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${sizeClass} ${
        onClick ? 'cursor-pointer hover:ring-2 hover:ring-[#1B2A6B]/20 transition-all' : 'cursor-default'
      } ${photoUrl ? '' : 'bg-[#E8E5DF] text-[#5A6472] font-semibold'}`}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials || <User className="w-1/2 h-1/2" />}</span>
      )}
      {showCameraOverlay && !photoUrl && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <Camera className="w-1/3 h-1/3 text-white" />
        </div>
      )}
    </button>
  );
}
