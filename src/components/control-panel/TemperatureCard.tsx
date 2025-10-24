import type { ChangeEvent, CSSProperties, FC } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowUp,
  faTemperatureHalf,
} from "@fortawesome/free-solid-svg-icons";
import {
  DEGREE_SYMBOL,
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
  TEMPERATURE_STEP,
} from "../../features/control-panel/constants";
import { cn } from "../../lib/cn";

type TemperatureCardProps = {
  currentLabel: string;
  targetLabel: string;
  temperatureValue: number | null;
  controlsDisabled: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onChange: (value: number) => void;
  variant?: "card" | "section";
  className?: string;
};

export const TemperatureCard: FC<TemperatureCardProps> = ({
  currentLabel,
  targetLabel,
  temperatureValue,
  controlsDisabled,
  onIncrease,
  onDecrease,
  onChange,
  variant = "card",
  className,
}) => {
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = Number(event.target.value);

    if (!Number.isFinite(nextValue)) {
      return;
    }

    onChange(nextValue);
  };

  const sliderValue = temperatureValue ?? TEMPERATURE_MIN;

  const ambientValue = currentLabel.includes(`${DEGREE_SYMBOL}C`)
    ? currentLabel.replace(`${DEGREE_SYMBOL}C`, "").trim()
    : currentLabel;

  const sliderStyle = {
    accentColor: `rgb(var(--accent-color))`,
  } as CSSProperties;

  return (
    <section
      className={cn(
        variant === "card" &&
          "rounded-3xl border border-[color:var(--border-soft)] bg-[var(--surface)]/85 backdrop-blur-md px-5 py-4 sm:px-6 sm:py-5",
        variant === "section" && "bg-transparent",
        className,
      )}
    >
      <div className="flex flex-col gap-4 w-auto">
        <div className="flex flex-col gap-4 rounded-2xl border border-[rgba(var(--accent-color),0.18)] bg-[rgba(var(--accent-color),0.08)] px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex p-3 items-center justify-center rounded-2xl bg-[rgba(var(--accent-color),0.2)] text-[rgb(var(--accent-color))]">
              <FontAwesomeIcon
                icon={faTemperatureHalf}
                className="h-7 w-7"
                aria-hidden="true"
              />
            </span>
            <div className="flex flex-col gap-1 text-[color:var(--text-primary)]">
              <span className="text-s font-semibold tracking-wide text-[color:var(--text-muted)]">
                Temperatura ambiente
              </span>
              <span className="text-2xl font-semibold leading-none">
                {ambientValue}
                {DEGREE_SYMBOL}C
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl ml-auto text-[color:var(--text-primary)]" role="group" aria-label="Control de temperatura objetivo">
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="digital-display text-8xl font-semibold leading-none text-[rgb(var(--accent-color))] sm:text-9xl">
                  {targetLabel}
                </span>
                <span className="text-xl font-semibold text-[color:var(--text-secondary)]">
                  {DEGREE_SYMBOL}C
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(var(--accent-color),0.3)] bg-[rgba(var(--accent-color),0.12)] text-[rgb(var(--accent-color))] transition hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-color),0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onIncrease}
                aria-label="Aumentar temperatura objetivo"
                title="Aumentar temperatura objetivo"
                disabled={controlsDisabled || sliderValue >= TEMPERATURE_MAX}
              >
                <FontAwesomeIcon icon={faArrowUp} className="h-5 w-5" />
              </button>

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(var(--accent-color),0.3)] bg-[rgba(var(--accent-color),0.12)] text-[rgb(var(--accent-color))] transition hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-color),0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onDecrease}
                aria-label="Disminuir temperatura objetivo"
                title="Disminuir temperatura objetivo"
                disabled={controlsDisabled || sliderValue <= TEMPERATURE_MIN}
              >
                <FontAwesomeIcon icon={faArrowDown} className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <input
        type="range"
        className="sr-only"
        min={TEMPERATURE_MIN}
        max={TEMPERATURE_MAX}
        step={TEMPERATURE_STEP}
        value={sliderValue}
        onChange={handleInput}
        aria-label="Temperatura objetivo"
        disabled={controlsDisabled}
        style={sliderStyle}
      />
    </section>
  );
};
