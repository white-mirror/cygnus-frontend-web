import type { JSX } from "react";
import { useMemo } from "react";

import { AuthProvider } from "./features/auth/AuthContext";
import { useAuth } from "./features/auth/useAuth";
import { LoginPage } from "./pages/Auth/LoginPage";
import { ControlPanelPage } from "./pages/ControlPanel/ControlPanelPage";

const AppContent = (): JSX.Element => {
  const { user, isInitialising } = useAuth();

  const content = useMemo(() => {
    if (isInitialising) {
      return (
        <div className="flex min-h-screen w-full items-center justify-center bg-transparent text-[color:var(--text-primary)]">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-[color:var(--border-soft)] bg-[color:var(--surface)]/80 px-8 py-10 shadow-lg backdrop-blur">
            <div className="h-3 w-3 animate-ping rounded-full bg-[rgb(var(--accent-color))]" />
            <p className="text-sm font-medium text-[color:var(--text-secondary)]">
              Preparando tu sesión...
            </p>
          </div>
        </div>
      );
    }

    if (user) {
      return <ControlPanelPage />;
    }

    return <LoginPage />;
  }, [isInitialising, user]);

  return content;
};

function App(): JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
