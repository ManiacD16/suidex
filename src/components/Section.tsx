import type React from "react";
import type { SectionProps } from "./types/banner";

export const Section: React.FC<SectionProps> = ({
  children,
  className = "",
}) => {
  return (
    <section className={`py-16 px-4 ${className}`}>
      <div className="container mx-auto grid md:grid-cols-2 gap-8 items-center">
        {children}
      </div>
    </section>
  );
};
