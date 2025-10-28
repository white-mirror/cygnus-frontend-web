import type { CSSProperties, JSX } from "react";

import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fa1, fa2, fa3, faA } from "@fortawesome/free-solid-svg-icons";
import type { FanSpeed } from "../../features/control-panel/types";
import {
  SELECTOR_CONTAINER_BASE_CLASSES,
  SELECTOR_OPTION_BASE_CLASSES,
  resolveSelectionState,
} from "./selectorShared";
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

const CONTAINER_CARD_CLASSES =
  "rounded-3xl rounded-t-none rounded-b-none border border-t-0 border-[color:var(--border-soft)] bg-[var(--surface)]/90 p-4 backdrop-blur-md sm:p-6";
const CONTAINER_SECTION_CLASSES = "border-none px-4";

const OPTION_RING_CLASSES =
  "focus-visible:ring-[rgba(var(--accent-color),0.35)]";

const ICON_BASE_CLASSES =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-transparent";
const ICON_DEFAULT_COLOR_CLASSES = "text-[rgb(var(--accent-color))]";
const ICON_APPLIED_CLASSES =
  "border-t-transparent border-l-transparent border-r-transparent border-dashed rounded-none border-b-[color:(var(--mode-accent))]";
const ICON_PENDING_CLASSES =
  "border-[rgb(var(--accent-color))]";
const ICON_SELECTED_CLASSES = "text-[color:var(--text-primary)]";

const LABEL_BASE_CLASSES =
  "text-sm font-semibold tracking-wide text-[var(--text-primary)]";

export const FanSelector = ({
  actualFanSpeed,
  pendingFanSpeed,
  controlsDisabled,
  onSelect,
  variant = "section",
  className,
}: FanSelectorProps): JSX.Element => {
  const containerClasses = cn(
    SELECTOR_CONTAINER_BASE_CLASSES,
    variant === "card" && CONTAINER_CARD_CLASSES,
    variant === "section" && CONTAINER_SECTION_CLASSES,
    className,
  );

  const optionClasses = cn(SELECTOR_OPTION_BASE_CLASSES, OPTION_RING_CLASSES);
  const optionStyle = {
    "--mode-accent": "var(--accent-color)",
  } as CSSProperties;

  return (
    <section className={containerClasses}>
      <header className="flex flex-col gap-1">
        <h2 className="mb-2 text-base font-semibold text-[color:var(--text-primary)]">
          Velocidad
        </h2>
      </header>

      <div className="ml-auto flex w-min flex-row justify-between gap-3">
        {FAN_OPTIONS.map((option) => {
          const isSelected = pendingFanSpeed === option.id;
          const { isApplied, isPending, isInactive } = resolveSelectionState(
            isSelected,
            actualFanSpeed === option.id,
          );

          const iconHighlightStyle = isPending
            ? { borderColor: "rgb(var(--accent-color))" }
            : undefined;
          const labelHighlightStyle = isPending
            ? { color: "rgb(var(--mode-accent))" }
            : undefined;

          const accessibilityLabel =
            option.id === "auto"
              ? "Ventilador automatico"
              : `Velocidad ${option.label}`;

          const iconClasses = cn(
            ICON_BASE_CLASSES,
            isSelected ? ICON_SELECTED_CLASSES : ICON_DEFAULT_COLOR_CLASSES,
            isInactive && "opacity-50",
            isApplied && ICON_APPLIED_CLASSES,
            isPending && ICON_PENDING_CLASSES,
          );

          return (
            <button
              key={option.id}
              type="button"
              className={optionClasses}
              style={optionStyle}
              onClick={() => onSelect(option.id)}
              aria-pressed={isSelected}
              aria-label={accessibilityLabel}
              title={accessibilityLabel}
              disabled={controlsDisabled}
            >
              <span className={iconClasses} style={iconHighlightStyle}>
                <FontAwesomeIcon
                  icon={option.icon}
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              <span className="flex flex-col items-center gap-1">
                <span
                  className={cn(LABEL_BASE_CLASSES, isInactive && "opacity-50")}
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
};
