"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import type { AboutSubsection } from "@/types";

type AboutSlideDotsProps = {
  activeIndex: number;
  subsections: AboutSubsection[];
  onSelect?: (index: number) => void;
  orientation?: "responsive" | "horizontal" | "vertical";
  isInteractive?: boolean;
};

export function AboutSlideDots({
  activeIndex,
  subsections,
  onSelect,
  orientation = "responsive",
  isInteractive = true,
}: AboutSlideDotsProps) {
  return (
    <>
      {subsections.map((subsection, index) => {
        const isActive = index === activeIndex;

        const dot = (
          <motion.span
            layout
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 32,
            }}
            className={cn(
              "pointer-events-none block rounded-full transition-colors duration-300",
              isActive
                ? cn(
                    "h-2 w-8 md:h-8 md:w-2 bg-ink",
                    orientation === "responsive" && "md:h-2 md:w-8",
                  )
                : cn(
                    "h-2 w-2 bg-dot-idle",
                    isInteractive && "group-hover:bg-dot-hover",
                  ),
            )}
          />
        );

        if (!isInteractive) {
          return (
            <span
              key={subsection.id}
              aria-current={isActive ? "step" : undefined}
              className="flex h-auto w-auto items-center justify-center rounded-full py-1 md:h-auto md:w-auto"
            >
              {dot}
            </span>
          );
        }

        return (
          <button
            key={subsection.id}
            type="button"
            aria-label={`Show about slide ${index + 1}`}
            aria-current={isActive ? "step" : undefined}
            onClick={() => onSelect?.(index)}
            className="group flex h-auto w-auto items-center justify-center rounded-full py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 md:h-auto md:w-auto"
          >
            {dot}
          </button>
        );
      })}
    </>
  );
}
