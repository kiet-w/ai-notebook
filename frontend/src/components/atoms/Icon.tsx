'use client';

import { LucideIcon } from 'lucide-react';

interface IconProps {
  icon: LucideIcon;
  size?: number | string;
  className?: string;
}

export default function Icon({ icon: IconComponent, size = 16, className = '' }: IconProps) {
  return <IconComponent size={size} className={className} />;
}
