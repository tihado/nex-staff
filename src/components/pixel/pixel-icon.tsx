"use client";

import { addCollection, Icon, type IconifyJSON } from "@iconify/react";
import pixelarticons from "@iconify-json/pixelarticons/icons.json";

// Bundle the pixel icon set offline so no runtime API request is needed.
addCollection(pixelarticons as IconifyJSON);

interface PixelIconProps {
  className?: string;
  label?: string;
  name: string;
  size?: number;
}

/**
 * Authentic 8-bit pixel-art icon (pixelarticons via Iconify) — used instead of
 * OS emoji so glyphs render identically everywhere and stay on-grid.
 */
export function PixelIcon({
  name,
  className,
  size = 24,
  label,
}: PixelIconProps) {
  return (
    <Icon
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={className}
      height={size}
      icon={`pixelarticons:${name}`}
      role={label ? "img" : undefined}
      width={size}
    />
  );
}
