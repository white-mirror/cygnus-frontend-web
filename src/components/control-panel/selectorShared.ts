export const SELECTOR_CONTAINER_BASE_CLASSES = "flex h-full w-full flex-col";

export const SELECTOR_OPTION_BASE_CLASSES =
  "flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl border border-[color:var(--border-soft)] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed";

export type SelectionState = {
  isApplied: boolean;
  isPending: boolean;
  isInactive: boolean;
};

export const resolveSelectionState = (
  isSelected: boolean,
  isApplied: boolean,
): SelectionState => ({
  isApplied,
  isPending: isSelected && !isApplied,
  isInactive: !isSelected && !isApplied,
});
