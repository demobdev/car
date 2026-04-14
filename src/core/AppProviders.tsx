import type { ReactNode } from "react";
import { PosterProvider } from "@/features/poster/ui/PosterContext";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Wraps the application in all required context providers.
 * Add new providers here as needed.
 */
import { ToastProvider } from "@/shared/context/ToastContext";

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ToastProvider>
      <PosterProvider>
        {children}
      </PosterProvider>
    </ToastProvider>
  );
}
