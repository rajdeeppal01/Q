import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";

// --- Types ---
export type AnimationVariant = "circle" | "rectangle" | "gif" | "polygon" | "circle-blur";
export type AnimationStart =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "top-center"
  | "bottom-center"
  | "bottom-up"
  | "top-down"
  | "left-right"
  | "right-left";

interface Animation {
  name: string;
  css: string;
}

// --- Animation Generators ---
const getPositionCoords = (position: AnimationStart) => {
  switch (position) {
    case "top-left": return { cx: "0", cy: "0" };
    case "top-right": return { cx: "40", cy: "0" };
    case "bottom-left": return { cx: "0", cy: "40" };
    case "bottom-right": return { cx: "40", cy: "40" };
    case "top-center": return { cx: "20", cy: "0" };
    case "bottom-center": return { cx: "20", cy: "40" };
    case "bottom-up":
    case "top-down":
    case "left-right":
    case "right-left": return { cx: "20", cy: "20" };
    default: return { cx: "20", cy: "20" };
  }
};

const generateSVG = (variant: AnimationVariant, start: AnimationStart) => {
  if (variant === "circle-blur") {
    if (start === "center") {
      return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="20" cy="20" r="18" fill="white" filter="url(%23blur)"/></svg>`;
    }
    const { cx, cy } = getPositionCoords(start);
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><filter id="blur"><feGaussianBlur stdDeviation="2"/></filter></defs><circle cx="${cx}" cy="${cy}" r="18" fill="white" filter="url(%23blur)"/></svg>`;
  }
  if (start === "center") return;
  if (variant === "rectangle") return "";
  const { cx, cy } = getPositionCoords(start);
  if (variant === "circle") {
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="${cx}" cy="${cy}" r="20" fill="white"/></svg>`;
  }
  return "";
};

const getTransformOrigin = (start: AnimationStart) => {
  switch (start) {
    case "top-left": return "top left";
    case "top-right": return "top right";
    case "bottom-left": return "bottom left";
    case "bottom-right": return "bottom right";
    case "top-center": return "top center";
    case "bottom-center": return "bottom center";
    case "bottom-up":
    case "top-down":
    case "left-right":
    case "right-left": return "center";
    default: return "center";
  }
};

export const createAnimation = (
  variant: AnimationVariant,
  start: AnimationStart = "center",
  blur = false,
  url?: string
): Animation => {
  const svg = generateSVG(variant, start);
  const transformOrigin = getTransformOrigin(start);

  if (variant === "rectangle") {
    const getClipPath = (direction: AnimationStart) => {
      switch (direction) {
        case "bottom-up": return { from: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)", to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" };
        case "top-down": return { from: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)", to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" };
        case "left-right": return { from: "polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)", to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" };
        case "right-left": return { from: "polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)", to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" };
        case "top-left": return { from: "polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)", to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" };
        case "top-right": return { from: "polygon(100% 0%, 100% 0%, 100% 0%, 100% 0%)", to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" };
        case "bottom-left": return { from: "polygon(0% 100%, 0% 100%, 0% 100%, 0% 100%)", to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" };
        case "bottom-right": return { from: "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)", to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" };
        default: return { from: "polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)", to: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" };
      }
    };
    const clipPath = getClipPath(start);

    return {
      name: `${variant}-${start}${blur ? "-blur" : ""}`,
      css: `
       ::view-transition-group(root) { animation-duration: 0.7s; animation-timing-function: ease-out; }
      ::view-transition-new(root) { animation-name: reveal-light-${start}${blur ? "-blur" : ""}; ${blur ? "filter: blur(2px);" : ""} }
      ::view-transition-old(root), .light-theme::view-transition-old(root) { animation: none; z-index: -1; }
      .light-theme::view-transition-new(root) { animation-name: reveal-dark-${start}${blur ? "-blur" : ""}; ${blur ? "filter: blur(2px);" : ""} }

      @keyframes reveal-dark-${start}${blur ? "-blur" : ""} {
        from { clip-path: ${clipPath.from}; ${blur ? "filter: blur(8px);" : ""} }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to { clip-path: ${clipPath.to}; ${blur ? "filter: blur(0px);" : ""} }
      }
      @keyframes reveal-light-${start}${blur ? "-blur" : ""} {
        from { clip-path: ${clipPath.from}; ${blur ? "filter: blur(8px);" : ""} }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to { clip-path: ${clipPath.to}; ${blur ? "filter: blur(0px);" : ""} }
      }
      `,
    };
  }
  
  if (variant === "circle" && start == "center") {
    return {
      name: `${variant}-${start}${blur ? "-blur" : ""}`,
      css: `
       ::view-transition-group(root) { animation-duration: 0.7s; animation-timing-function: ease-out; }
      ::view-transition-new(root) { animation-name: reveal-light${blur ? "-blur" : ""}; ${blur ? "filter: blur(2px);" : ""} }
      ::view-transition-old(root), .light-theme::view-transition-old(root) { animation: none; z-index: -1; }
      .light-theme::view-transition-new(root) { animation-name: reveal-dark${blur ? "-blur" : ""}; ${blur ? "filter: blur(2px);" : ""} }

      @keyframes reveal-dark${blur ? "-blur" : ""} {
        from { clip-path: circle(0% at 50% 50%); ${blur ? "filter: blur(8px);" : ""} }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to { clip-path: circle(100.0% at 50% 50%); ${blur ? "filter: blur(0px);" : ""} }
      }
      @keyframes reveal-light${blur ? "-blur" : ""} {
        from { clip-path: circle(0% at 50% 50%); ${blur ? "filter: blur(8px);" : ""} }
        ${blur ? "50% { filter: blur(4px); }" : ""}
        to { clip-path: circle(100.0% at 50% 50%); ${blur ? "filter: blur(0px);" : ""} }
      }
      `,
    };
  }

  if (variant === "circle-blur") {
    const isCenter = start === "center";
    return {
      name: `${variant}-${start}`,
      css: `
      ::view-transition-group(root) { animation-timing-function: ease-out; }
      ::view-transition-new(root) {
        mask: url('${svg}') ${isCenter ? 'center' : start.replace("-", " ")} / 0 no-repeat;
        mask-origin: content-box;
        animation: scale 1s;
        transform-origin: ${isCenter ? 'center' : transformOrigin};
      }
      ::view-transition-old(root), .light-theme::view-transition-old(root) {
        animation: scale 1s;
        transform-origin: ${isCenter ? 'center' : transformOrigin};
        z-index: -1;
      }
      @keyframes scale { to { mask-size: 350vmax; } }
      `,
    };
  }

  // Fallback for others
  return {
    name: "default",
    css: `
      ::view-transition-group(root) { animation-timing-function: ease-in; }
      ::view-transition-new(root) {
        mask: url('${svg}') ${start.replace("-", " ")} / 0 no-repeat;
        mask-origin: content-box;
        animation: scale-def 1s;
        transform-origin: ${transformOrigin};
      }
      ::view-transition-old(root), .light-theme::view-transition-old(root) {
        animation: scale-def 1s;
        transform-origin: ${transformOrigin};
        z-index: -1;
      }
      @keyframes scale-def { to { mask-size: 2000vmax; } }
    `
  }
};


// --- Hooks ---
export const useThemeToggle = ({
  variant = "circle",
  start = "center",
  blur = false,
  gifUrl = "",
}: {
  variant?: AnimationVariant;
  start?: AnimationStart;
  blur?: boolean;
  gifUrl?: string;
} = {}) => {
  const [isDark, setIsDark] = useState(
    typeof document !== "undefined" ? !document.documentElement.classList.contains('light-theme') : true
  );

  const styleId = "theme-transition-styles";
  const updateStyles = useCallback((css: string) => {
    if (typeof window === "undefined") return;
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
  }, []);

  const toggleTheme = useCallback(() => {
    const animation = createAnimation(variant, start, blur, gifUrl);
    updateStyles(animation.css);

    if (typeof window === "undefined") return;

    const switchTheme = () => {
      const willBeDark = document.documentElement.classList.contains('light-theme');
      setIsDark(willBeDark);
      if (willBeDark) {
        document.documentElement.classList.remove('light-theme');
      } else {
        document.documentElement.classList.add('light-theme');
      }
    };

    if (!document.startViewTransition) {
      switchTheme();
      return;
    }
    document.startViewTransition(switchTheme);
  }, [variant, start, blur, gifUrl, updateStyles]);

  return { isDark, toggleTheme };
};


// --- Components ---
export const ThemeToggleButton = ({
  className = "",
  variant = "circle",
  start = "center",
  blur = false,
  gifUrl = "",
}: {
  className?: string;
  variant?: AnimationVariant;
  start?: AnimationStart;
  blur?: boolean;
  gifUrl?: string;
}) => {
  const { isDark, toggleTheme } = useThemeToggle({ variant, start, blur, gifUrl });

  return (
    <button
      type="button"
      className={className}
      style={{
        width: 40, height: 40, borderRadius: '50%', background: 'black',
        padding: 0, border: 'none', cursor: 'pointer', transition: 'transform 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
      onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <motion.g animate={{ rotate: isDark ? -180 : 0 }} transition={{ ease: "easeInOut", duration: 0.5 }}>
          <path d="M120 67.5C149.25 67.5 172.5 90.75 172.5 120C172.5 149.25 149.25 172.5 120 172.5" fill="white" />
          <path d="M120 67.5C90.75 67.5 67.5 90.75 67.5 120C67.5 149.25 90.75 172.5 120 172.5" fill="black" />
        </motion.g>
        <motion.path
          animate={{ rotate: isDark ? 180 : 0 }}
          transition={{ ease: "easeInOut", duration: 0.5 }}
          d="M120 3.75C55.5 3.75 3.75 55.5 3.75 120C3.75 184.5 55.5 236.25 120 236.25C184.5 236.25 236.25 184.5 236.25 120C236.25 55.5 184.5 3.75 120 3.75ZM120 214.5V172.5C90.75 172.5 67.5 149.25 67.5 120C67.5 90.75 90.75 67.5 120 67.5V25.5C172.5 25.5 214.5 67.5 214.5 120C214.5 172.5 172.5 214.5 120 214.5Z"
          fill="white"
        />
      </svg>
    </button>
  );
};
