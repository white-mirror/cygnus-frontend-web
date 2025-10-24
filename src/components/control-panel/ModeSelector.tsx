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

export const ModeSelector = ({
  activeMode,
  appliedMode,
  controlsDisabled,
  accentPreview,
  onSelect,
  variant = "section",
  className,
}: ModeSelectorProps): JSX.Element => {
  const selectorStyle = {
    "--selector-accent": accentPreview,
  } as CSSProperties;

  return (
    <section
      className={cn(
        "flex h-full w-full flex-col",
        variant === "card" &&
          "rounded-3xl rounded-b-none border border-b-0 border-[color:var(--border-soft)] bg-[var(--surface)]/90 p-4 backdrop-blur-md sm:p-6",
        variant === "section" &&
          "border-none px-4",
        className,
      )}
      style={selectorStyle}
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-[color:var(--text-primary)] mb-2">
          Modo
        </h2>
      </header>

      <div className="flex flex-row justify-between gap-3 w-min ml-auto">
        {MODE_OPTIONS.map((option) => {
          const isSelected = activeMode === option.id;
          const isApplied = appliedMode === option.id;
          const isPendingSelection = isSelected && !isApplied;
          const isInactive = !isSelected && !isApplied;
          const iconHighlightStyle = isPendingSelection
            ? { borderColor: "rgb(var(--mode-accent))" }
            : undefined;
          const labelHighlightStyle = isPendingSelection
            ? { color: "rgb(var(--mode-accent))" }
            : undefined;
          const optionStyle = {
            "--mode-accent": ACCENT_BY_MODE[option.id],
          } as CSSProperties;

          return (
            <button
              key={option.id}
              type="button"
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border border-[color:var(--border-soft)] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--mode-accent),0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed",
              )}
              style={optionStyle}
              onClick={() => onSelect(option.id)}
              aria-pressed={isSelected}
              disabled={controlsDisabled}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-transparent text-[rgb(var(--mode-accent))]",
                  isInactive && "opacity-50",
                )}
                style={iconHighlightStyle}
                title={option.label}
              >
                <FontAwesomeIcon
                  icon={option.icon}
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              <span
                className={cn(
                  "text-xs font-semibold tracking-wide text-white",
                  isInactive && "opacity-50",
                )}
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
