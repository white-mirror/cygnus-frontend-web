import type { FC } from "react";
import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faMoon,
  faSignOut,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "../../lib/cn";
import { Logo } from "../brand/Logo";
import { ACCENT_OFF } from "../../features/control-panel/constants";

type PanelHeaderProps = {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  userName: string;
  userInitials: string;
  onLogout: () => void;
};

export const PanelHeader: FC<PanelHeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  theme,
  onToggleTheme,
  userName,
  userInitials,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleClickAway = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickAway);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickAway);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isUserMenuOpen]);

  const isDarkMode = theme === "dark";
  const themeLabel = isDarkMode
    ? "Cambiar a modo claro"
    : "Cambiar a modo oscuro";
  const logoutLabel = "Cerrar sesión";
  const profileMenuLabel = isUserMenuOpen
    ? "Cerrar menú de usuario"
    : "Abrir menú de usuario";

  const actionBaseClasses =
    "inline-flex items-center justify-center rounded-full border border-[color:var(--border-soft)] text-[color:var(--text-secondary)] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-color))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:opacity-60 transform-gpu will-change-transform";

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border-soft)] bg-[var(--surface)]/92 backdrop-blur-xl">
      <div className="flex w-full flex-col gap-3 px-4 py-2 sm:px-6 sm:py-2 lg:px-8 lg:py-4">
        <div className="flex w-full flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-3">
            {showBackButton && typeof onBack === "function" ? (
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-start rounded-full border border-[color:var(--border-soft)] text-[color:var(--text-primary)] transition hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-color))] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                aria-label="Volver"
                onClick={onBack}
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
              </button>
            ) : (
              <span className="w-10 h-10 lg:hidden" aria-hidden="true" />
            )}

            <div className="hidden items-center gap-3 lg:flex">
              <Logo
                className="h-10 w-10 select-none"
                accentColor="rgb(var(--accent-color))"
                outlineColor={`rgb(${ACCENT_OFF})`}
                strokeWidth={!isDarkMode ? 10 : 0}
                aria-hidden="true"
              />
            </div>

            <h1 className="flex-1 text-center text-lg font-semibold text-[color:var(--text-primary)] sm:text-xl">
              {title}
            </h1>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                className={cn(
                  actionBaseClasses,
                  "h-10 w-10 rounded-full border-transparent text-[color:var(--text-secondary)] p-0",
                  isUserMenuOpen ? "bg-[var(--surface-subtle)]" : "hover:bg-[var(--surface)]",
                )}
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                aria-label={profileMenuLabel}
                title={profileMenuLabel}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(var(--accent-color),0.2)] text-sm font-semibold tracking-wide text-[rgb(var(--accent-color))]">
                  {userInitials}
                </span>
              </button>

              {isUserMenuOpen && (
                <div
                  role="menu"
                  aria-label="Menú de usuario"
                  className="absolute right-0 z-10 mt-3 w-64 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface)] p-3 shadow-sm"
                >
                  <div className="mb-2 rounded-xl bg-[var(--surface-soft)] px-3 py-2">
                    <p className="text-xs font-semibold tracking-wide text-[color:var(--text-muted)]">
                      Sesión activa
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                      {userName}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[color:var(--text-secondary)] transition hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-color))] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onToggleTheme();
                    }}
                    aria-label={themeLabel}
                    title={themeLabel}
                  >
                    <FontAwesomeIcon
                      icon={isDarkMode ? faSun : faMoon}
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    <span>{themeLabel}</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface)]"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    aria-label={logoutLabel}
                    title={logoutLabel}
                  >
                    <FontAwesomeIcon
                      icon={faSignOut}
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                    <span>{logoutLabel}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
