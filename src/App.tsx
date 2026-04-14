import { useState } from "react";
import { AppProviders } from "@/core/AppProviders";
import AppShell from "@/shared/ui/AppShell";
import Homepage from "@/shared/ui/Homepage";
import CheckoutSuccess from "@/features/checkout/ui/CheckoutSuccess";
import { usePosterContext } from "@/features/poster/ui/PosterContext";

import { posterDraftRepository } from "@/core/services";
import type { PosterDraft } from "@/features/poster/domain/ports";

function Router() {
  const [route, setRoute] = useState<"home" | "editor">("home");
  const { dispatch } = usePosterContext();

  const handleStart = (preset?: { title: string; subtitle: string }) => {
    if (preset) {
      dispatch({ 
        type: "SET_FORM_FIELDS", 
        fields: { displayCity: preset.title, displayCountry: preset.subtitle },
        resetDisplayNameOverrides: false,
      });
    }
    setRoute("editor");
  };

  const handleResume = (draft: PosterDraft) => {
    dispatch({ type: "HYDRATE_DRAFT", draft });
    setRoute("editor");
  };

  if (route === "home") {
    // Basic routing for Stripe redirect logic
    const query = new URLSearchParams(window.location.search);
    if (query.get("success") === "true") {
      return <CheckoutSuccess />;
    }
    return <Homepage onStart={handleStart} onResume={handleResume} />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <AppProviders>
      <Router />
    </AppProviders>
  );
}
