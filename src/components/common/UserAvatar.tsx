import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { extractManagedAvatarPath, getInitials, isManagedAvatarUrl } from '../../utils/helpers';

interface UserAvatarProps {
  avatarUrl: string | null | undefined;
  name: string | null | undefined;
  alt?: string;
  className: string;
  imageClassName?: string;
  fallbackClassName: string;
  /** Pixel size for image transformation (width & height). Defaults to 80 (2× for h-10 avatars). */
  size?: number;
}

export default function UserAvatar({
  avatarUrl,
  name,
  alt = '',
  className,
  imageClassName = 'h-full w-full object-cover',
  fallbackClassName,
  size = 80,
}: UserAvatarProps) {
  const resolveAvatarSrc = (value: string | null | undefined): string | null => {
    if (!value || !isManagedAvatarUrl(value)) return null;

    if (value.startsWith('data:image/') || value.startsWith('blob:')) {
      return value;
    }

    const objectPath = extractManagedAvatarPath(value);
    if (!objectPath) {
      return value;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(objectPath, {
      transform: { width: size, height: size, quality: 80, resize: 'cover' },
    });
    return data.publicUrl;
  };

  const [currentSrc, setCurrentSrc] = useState<string | null>(resolveAvatarSrc(avatarUrl));
  const [signedUrlAttempted, setSignedUrlAttempted] = useState(false);

  useEffect(() => {
    setCurrentSrc(resolveAvatarSrc(avatarUrl));
    setSignedUrlAttempted(false);
  }, [avatarUrl]);

  const handleImageError = async () => {
    if (signedUrlAttempted) {
      setCurrentSrc(null);
      return;
    }

    const objectPath = extractManagedAvatarPath(avatarUrl);
    if (!objectPath) {
      setCurrentSrc(null);
      return;
    }

    setSignedUrlAttempted(true);

    const { data, error } = await supabase.storage.from('avatars').createSignedUrl(objectPath, 3600);
    if (error || !data?.signedUrl) {
      setCurrentSrc(null);
      return;
    }

    setCurrentSrc(data.signedUrl);
  };

  return (
    <div className={className}>
      {currentSrc ? (
        <img src={currentSrc} alt={alt} className={imageClassName} onError={() => void handleImageError()} />
      ) : (
        <span className={fallbackClassName}>{getInitials(name)}</span>
      )}
    </div>
  );
}