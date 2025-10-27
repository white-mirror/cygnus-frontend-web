import {
  type ChangeEvent,
  type FormEvent,
  type JSX,
  useCallback,
  useMemo,
  useState,
} from "react";

import { isUnauthorizedError } from "../../api/errors";
import { useAuth } from "../../features/auth/useAuth";

type FieldErrors = {
  email?: string;
  password?: string;
};

const validateEmail = (email: string): string | undefined => {
  if (!email || email.trim().length === 0) {
    return "Ingresá tu email.";
  }

  // Simple email validation to avoid adding extra deps.
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email.trim())) {
    return "El formato del email no es válido.";
  }

  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (!password || password.trim().length === 0) {
    return "Ingresá tu contraseña.";
  }

  return undefined;
};

export const LoginPage = (): JSX.Element => {
  const { login, isAuthenticating } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validateFields = useCallback(
    (nextEmail: string, nextPassword: string): FieldErrors => {
      return {
        email: validateEmail(nextEmail),
        password: validatePassword(nextPassword),
      };
    },
    [],
  );

  const errors = useMemo<FieldErrors>(() => {
    return validateFields(email, password);
  }, [email, password, validateFields]);

  const isValid = useMemo(
    () => !errors.email && !errors.password,
    [errors.email, errors.password],
  );

  const handleEmailChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setEmail(event.target.value);
    setFormError(null);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setPassword(event.target.value);
    setFormError(null);
  };

  const handleBlur = (field: "email" | "password") => (): void => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
    setFieldErrors(errors);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setTouched({ email: true, password: true });
    const currentErrors = validateFields(email, password);
    setFieldErrors(currentErrors);

    if (currentErrors.email || currentErrors.password) {
      return;
    }

    try {
      await login(email.trim(), password);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        setFormError("Email o contraseña incorrectos.");
        return;
      }
      console.error("[login] Unexpected error", error);
      setFormError("No pudimos iniciar sesión. Intentalo nuevamente.");
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-8 text-[color:var(--text-primary)] sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[rgba(var(--accent-color),0.08)] blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[rgba(255,120,71,0.1)] blur-3xl sm:h-[420px] sm:w-[420px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(var(--accent-color),0.15),transparent_55%),radial-gradient(circle_at_85%_15%,rgba(255,120,71,0.1),transparent_60%)]" />
      </div>

      <div className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[color:var(--border-soft)] bg-[var(--surface-glass)] shadow-xl shadow-black/5 backdrop-blur-xl md:flex-row md:border-transparent md:bg-[var(--surface-glass)]">
        <section className="flex w-full flex-col gap-6 px-6 py-10 sm:px-10 lg:px-16">
          <div className="flex items-center gap-3">
            <img
              src="/cygnus-logo.png"
              alt="Cygnus"
              className="h-12 w-auto select-none"
              draggable={false}
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--text-muted)]">
                Plataforma Cygnus
              </span>
              <span className="text-base font-semibold text-[color:var(--text-secondary)]">
                Clima inteligente para cada espacio
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-left">
            <span className="text-sm font-semibold uppercase tracking-[0.35em] text-[color:var(--text-muted)]">
              Bienvenida/o
            </span>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Ingresá a tu panel de Cygnus
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-[color:var(--text-secondary)] sm:text-base">
              Controlá tus dispositivos desde un solo lugar. Iniciá sesión con tu
              cuenta corporativa para continuar.
            </p>
          </div>

          <form
            className="mt-2 flex flex-col gap-5"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            noValidate
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-email"
                className="text-sm font-semibold text-[color:var(--text-secondary)]"
              >
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleBlur("email")}
                placeholder="tu.email@empresa.com"
                className={`w-full rounded-2xl border bg-[var(--surface-input)] px-4 py-3 text-base shadow-sm outline-none transition focus:border-[rgba(var(--accent-color),0.4)] focus:ring-4 focus:ring-[rgba(var(--accent-color),0.2)] ${
                  touched.email && errors.email
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-[color:var(--border-soft)] text-[color:var(--text-primary)]"
                }`}
              />
              {touched.email && errors.email ? (
                <span className="text-xs font-medium text-red-500">{errors.email}</span>
              ) : null}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="login-password"
                className="text-sm font-semibold text-[color:var(--text-secondary)]"
              >
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={handleBlur("password")}
                placeholder="********"
                className={`w-full rounded-2xl border bg-[var(--surface-input)] px-4 py-3 text-base shadow-sm outline-none transition focus:border-[rgba(var(--accent-color),0.4)] focus:ring-4 focus:ring-[rgba(var(--accent-color),0.2)] ${
                  touched.password && errors.password
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                    : "border-[color:var(--border-soft)] text-[color:var(--text-primary)]"
                }`}
              />
              {touched.password && errors.password ? (
                <span className="text-xs font-medium text-red-500">
                  {errors.password}
                </span>
              ) : null}
            </div>

            {formError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-600">
                {formError}
              </div>
            ) : null}

            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-full bg-[rgb(var(--accent-color))] px-6 py-3 text-base font-semibold text-white shadow-[0_14px_30px_rgba(43,139,255,0.28)] transition hover:bg-[rgba(var(--accent-color),0.92)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-color),0.4)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isValid || isAuthenticating}
            >
              {isAuthenticating ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="text-xs text-[color:var(--text-muted)]">
            Si necesitás crear o restablecer tu usuario, contactá al equipo de soporte.
          </p>
        </section>

        <aside className="hidden flex-1 flex-col justify-between gap-6 bg-gradient-to-br from-[rgba(var(--accent-color),0.12)] via-transparent to-[rgba(255,120,71,0.14)] px-10 py-12 md:flex">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(var(--accent-color),0.25)] bg-[var(--surface-glass)] px-4 py-2 text-sm font-semibold text-[rgba(var(--accent-color),0.95)] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[rgb(var(--accent-color))]" />
              Sesión segura activada
            </div>
            <h2 className="text-2xl font-semibold text-[color:var(--text-primary)]">
              Monitoreá, ajustá y automatizá tu clima.
            </h2>
            <p className="text-sm leading-relaxed text-[color:var(--text-secondary)]">
              Accedé al panel de control para cambiar modos, revisar temperatura en
              tiempo real y coordinar tu hogar inteligente desde donde estés.
            </p>
          </div>

          <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-3xl border border-[color:var(--border-soft)] bg-[var(--surface-glass)] shadow-lg backdrop-blur">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(var(--accent-color),0.35),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(255,120,71,0.25),transparent_70%)]" />
            <div className="relative z-10 flex flex-col items-center gap-2 text-center">
              <span className="digital-display text-5xl font-semibold text-[rgba(var(--accent-color),0.95)]">
                22°
              </span>
              <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--text-secondary)]">
                Comfort Mode
              </span>
              <p className="max-w-[220px] text-xs text-[color:var(--text-secondary)]">
                Ajustamos tus equipos para mantener la temperatura ideal todo el día.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
