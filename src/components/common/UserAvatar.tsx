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
}

export default function UserAvatar({
  avatarUrl,
  name,
  alt = '',
  className,
  imageClassName = 'h-full w-full object-cover',
  fallbackClassName,
}: UserAvatarProps) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(
    isManagedAvatarUrl(avatarUrl) ? avatarUrl ?? null : null
  );
  const [signedUrlAttempted, setSignedUrlAttempted] = useState(false);

  useEffect(() => {
    setCurrentSrc(isManagedAvatarUrl(avatarUrl) ? avatarUrl ?? null : null);
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