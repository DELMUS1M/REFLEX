import { ImageOff } from 'lucide-react';

/**
 * Stands in for real photography until you have rights-cleared images to
 * drop in (your own shots of riders/shops, or a licensed stock purchase).
 * Deliberately looks unfinished: an icon and a caption, not a fake photo.
 * That way nobody mistakes it for shipped content and it can't quietly go live.
 *
 * Swap usage: replace this component with an <img> or background-image
 * once you have the real asset, matching the same aspect ratio.
 */
export function PlaceholderPhoto({
  caption,
  className = '',
}: {
  caption: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 bg-[var(--color-muted)] text-center ${className}`}
    >
      <ImageOff className="text-[var(--color-muted-foreground)]" size={28} aria-hidden="true" />
      <p className="max-w-[220px] px-4 text-sm text-[var(--color-muted-foreground)]">
        Photo needed: {caption}
      </p>
    </div>
  );
}
