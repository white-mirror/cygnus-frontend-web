import type { CSSProperties, JSX } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowsRotate,
  faDroplet,
  faFire,
  faSnowflake,
  faWind,
} from "@fortawesome/free-solid-svg-icons";
import { ACCENT_BY_MODE } from "../../features/control-panel/constants";
import type { Mode } from "../../features/control-panel/types";
import {
  SELECTOR_CONTAINER_BASE_CLASSES,
  SELECTOR_OPTION_BASE_CLASSES,
  resolveSelectionState,
} from "./selectorShared";
import { cn } from "../../lib/cn";

const MODE_OPTIONS: Array<{
  id: Exclude<Mode, "off">;
  label: string;
  icon: IconDefinition;
}> = [
  {
    id: "auto",
    label: "Auto",
    icon: faArrowsRotate,
  },
  {
    id: "cool",
    label: "Frio",
    icon: faSnowflake,
  },
  {
    id: "dry",
    label: "Seco",
    icon: faDroplet,
  },
  {
    id: "fan",
    label: "Ventilar",
    icon: faWind,
  },
  {
    id: "heat",
    label: "Calor",
    icon: faFire,
  },
];

type ModeSelectorProps = {
  activeMode: Mode | null;
  appliedMode: Mode | null;
  controlsDisabled: boolean;
  accentPreview: string;
  onSelect: (mode: Exclude<Mode, "off">) => void;
  variant?: "card" | "section";
  className?: string;
};

const CONTAINER_CARD_CLASSES =
  "rounded-3xl rounded-b-none border border-b-0 border-[color:var(--border-soft)] bg-[var(--surface)]/90 p-4 backdrop-blur-md sm:p-6";
const CONTAINER_SECTION_CLASSES = "border-none px-4";

const OPTION_RING_CLASSES =
  "focus-visible:ring-[rgba(var(--mode-accent),0.35)]";

const ICON_BASE_CLASSES =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-transparent text-[rgb(var(--mode-accent))]";
const ICON_APPLIED_CLASSES =
  "border-t-transparent border-l-transparent border-r-transparent border-dashed rounded-none border-b-[color:(var(--mode-accent))]";

const LABEL_BASE_CLASSES =
  "text-xs font-semibold tracking-wide text-[var(--text-primary)]";

export const ModeSelector = ({
  activeMode,
  appliedMode,
  controlsDisabled,
  accentPreview,
  onSelect,
  variant = "section",
  className,
}: ModeSelectorProps): JSX.Element => {
  const containerClasses = cn(
    SELECTOR_CONTAINER_BASE_CLASSES,
    variant === "card" && CONTAINER_CARD_CLASSES,
    variant === "section" && CONTAINER_SECTION_CLASSES,
    className,
  );

  const optionClasses = cn(SELECTOR_OPTION_BASE_CLASSES, OPTION_RING_CLASSES);

  const selectorStyle = {
    "--selector-accent": accentPreview,
  } as CSSProperties;

  return (
    <section className={containerClasses} style={selectorStyle}>
      <header className="flex flex-col gap-1">
        <h2 className="mb-2 text-base font-semibold text-[color:var(--text-primary)]">
          Modo
        </h2>
      </header>

      <div className="ml-auto flex w-min flex-row justify-between gap-3">
        {MODE_OPTIONS.map((option) => {
          const isSelected = activeMode === option.id;
          const { isApplied, isPending, isInactive } = resolveSelectionState(
            isSelected,
            appliedMode === option.id,
          );

          const iconHighlightStyle = isPending
            ? { borderColor: "rgb(var(--mode-accent))" }
            : undefined;
          const labelHighlightStyle = isPending
            ? { color: "rgb(var(--mode-accent))" }
            : undefined;

          const optionStyle = {
            "--mode-accent": ACCENT_BY_MODE[option.id],
          } as CSSProperties;

          const iconClasses = cn(
            ICON_BASE_CLASSES,
            isInactive && "opacity-50",
            isApplied && ICON_APPLIED_CLASSES,
          );

          return (
            <button
              key={option.id}
              type="button"
              className={optionClasses}
              style={optionStyle}
              onClick={() => onSelect(option.id)}
              aria-pressed={isSelected}
              disabled={controlsDisabled}
            >
              <span className={iconClasses} style={iconHighlightStyle} title={option.label}>
                <FontAwesomeIcon
                  icon={option.icon}
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              <span
                className={cn(LABEL_BASE_CLASSES, isInactive && "opacity-50")}
                style={labelHighlightStyle}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
