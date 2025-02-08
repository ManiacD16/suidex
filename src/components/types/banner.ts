import type React from "react";

export interface Banner {
  image: string;
  alt: string;
}

export interface BannerProps {
  banners: Banner[];
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
}

export interface SectionProps {
  children: React.ReactNode;
  className?: string;
}
