'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface IconProps {
  icon: LucideIcon;
  size?: number | string;
  className?: string;
}

export function Icon({ icon: IconComponent, size = 16, className = '' }: IconProps) {
  return <IconComponent size={size} className={className} />;
}

export default Icon;
