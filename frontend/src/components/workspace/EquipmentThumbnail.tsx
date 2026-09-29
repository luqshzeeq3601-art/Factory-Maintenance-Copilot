import { useState, type HTMLAttributes } from "react";
import { EquipmentSchematicIcon, resolveMachineCategory } from "./EquipmentSchematicIcon";

export interface EquipmentThumbnailProps extends HTMLAttributes<HTMLDivElement> {
  machineId?: string;
  name?: string;
  type?: string;
  size?: "sm" | "md" | "lg" | "xl";
  src?: string;
  alt?: string;
}

/**
 * Standardized Equipment Thumbnail component.
 * Serves optimized machine illustrations with automatic fallback to high-precision schematics.
 */
export function EquipmentThumbnail({
  machineId = "",
  name = "",
  type = "",
  size = "md",
  src,
  alt,
  className = "",
  ...rest
}: EquipmentThumbnailProps) {
  const category = resolveMachineCategory(machineId, name, type);
  const [imgError, setImgError] = useState(false);

  // Resolved image path if explicit src isn't provided
  const imageSource = src ?? (!imgError ? `/equipment/${category}.png` : undefined);

  const containerSizes = {
    sm: "w-11 h-11 min-w-[44px]",
    md: "w-14 h-14 min-w-[56px]",
    lg: "w-18 h-18 min-w-[72px]",
    xl: "w-28 h-28 min-w-[112px] p-2"
  }[size];

  if (!imageSource || imgError) {
    return (
      <EquipmentSchematicIcon
        machineId={machineId}
        name={name}
        type={type}
        size={size}
        className={className}
        {...rest}
      />
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center rounded-[var(--radius-control)] border border-line bg-sunken overflow-hidden shrink-0 ${containerSizes} ${className}`}
      {...rest}
    >
      <img
        src={imageSource}
        alt={alt ?? name ?? machineId}
        onError={() => setImgError(true)}
        className="w-full h-full object-contain select-none"
        loading="lazy"
      />
    </div>
  );
}
