import type { JSX } from "react";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fa1, fa2, fa3, faA } from "@fortawesome/free-solid-svg-icons";
import type { FanSpeed } from "../../features/control-panel/types";
import { cn } from "../../lib/cn";

const FAN_OPTIONS: Array<{
  id: FanSpeed;
  label: string;
  icon: IconDefinition;
}> = [
  {
    id: "auto",
    label: "Auto",
    icon: faA,
  },
  {
    id: "low",
    label: "Baja",
    icon: fa1,
  },
  {
    id: "medium",
    label: "Media",
    icon: fa2,
  },
  {
    id: "high",
    label: "Alta",
    icon: fa3,
  },
];

type FanSelectorProps = {
  actualFanSpeed: FanSpeed;
  pendingFanSpeed: FanSpeed | null;
  controlsDisabled: boolean;
  onSelect: (fan: FanSpeed) => void;
  variant?: "card" | "section";
  className?: string;
};

export const FanSelector = ({
  actualFanSpeed,
  pendingFanSpeed,
  controlsDisabled,
  onSelect,
  variant = "section",
  className,
}: FanSelectorProps): JSX.Element => (
  <section
    className={cn(
      "flex h-full w-full flex-col",
      variant === "card" &&
        "rounded-3xl rounded-t-none rounded-b-none border border-t-0 border-[color:var(--border-soft)] bg-[var(--surface)]/90 p-4 backdrop-blur-md sm:p-6",
      variant === "section" && "border-none px-4",
      className
    )}
  >
    <header className="flex flex-col gap-1">
      <h2 className="text-base font-semibold text-[color:var(--text-primary)] mb-2">
        Velocidad
      </h2>
    </header>

    <div className="flex flex-row justify-between gap-3 w-min ml-auto">
      {FAN_OPTIONS.map((option) => {
        const isActive = actualFanSpeed === option.id;
        const isSelected = pendingFanSpeed === option.id;
        const isPending =
          pendingFanSpeed !== null &&
          pendingFanSpeed === option.id &&
          pendingFanSpeed !== actualFanSpeed;
        const isInactive = !isSelected && !isActive;
        const iconHighlightStyle = isPending
          ? { borderColor: "rgb(var(--accent-color))" }
          : undefined;
        const labelHighlightStyle = isPending
          ? { color: "rgb(var(--accent-color))" }
          : undefined;

        const accessibilityLabel =
          option.id === "auto"
            ? "Ventilador automatico"
            : `Velocidad ${option.label}`;

        return (
          <button
            key={option.id}
            type="button"
            className={cn(
              "flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border border-[color:var(--border-soft)] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-color),0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed"
            )}
            onClick={() => onSelect(option.id)}
            aria-pressed={isSelected || isActive}
            aria-label={accessibilityLabel}
            title={accessibilityLabel}
            disabled={controlsDisabled}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent text-[rgb(var(--accent-color))]",
                isInactive && "opacity-50",
                isActive &&
                  "border-t-0 border-l-0 border-r-0 border-dashed rounded-none border-[color:(var(--mode-accent))]"
              )}
              style={iconHighlightStyle}
            >
              <FontAwesomeIcon
                icon={option.icon}
                className="h-5 w-5"
                aria-hidden="true"
              />
            </span>

            <span className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "text-sm font-semibold tracking-wide text-[var(--text-primary)]",
                  isInactive && "opacity-50"
                )}
                style={labelHighlightStyle}
              >
                {option.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  </section>
);
