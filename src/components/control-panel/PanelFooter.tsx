import type { CSSProperties, FC } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { cn } from "../../lib/cn";

type PanelFooterProps = {
  hasPendingChanges: boolean;
  controlsDisabled: boolean;
  confirmAccent: string;
  onSubmit: () => void;
  layout: "floating" | "sticky";
};

export const PanelFooter: FC<PanelFooterProps> = ({
  hasPendingChanges,
  controlsDisabled,
  confirmAccent,
  onSubmit,
  layout,
}) => {
  const accentStyle = {
    "--confirm-accent": confirmAccent,
  } as CSSProperties;

  const isDisabled = controlsDisabled || !hasPendingChanges;

  const buttonClasses = cn(
    "flex h-16 w-16 items-center justify-center rounded-full text-white transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--confirm-accent))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] transform-gpu will-change-transform",
    isDisabled
      ? "bg-[rgba(148,163,184,0.45)] text-white/70 pointer-events-none"
      : "bg-[rgb(var(--confirm-accent))] hover:scale-[1.05]",
  );

  const button = (
    <button
      type="button"
      className={cn(buttonClasses, "pointer-events-auto")}
      style={accentStyle}
      onClick={onSubmit}
      disabled={isDisabled}
      aria-label="Confirmar cambios pendientes"
      title="Confirmar cambios pendientes"
    >
      <FontAwesomeIcon icon={faCheck} className="h-6 w-6" aria-hidden="true" />
    </button>
  );

  if (!hasPendingChanges) {
    return null;
  }

  if (layout === "sticky") {
    return (
      <div className="sticky bottom-4 z-30 flex justify-center px-2 lg:hidden">
        {button}
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed bottom-8 right-6 z-40 hidden lg:flex">
      {button}
    </div>
  );
};
