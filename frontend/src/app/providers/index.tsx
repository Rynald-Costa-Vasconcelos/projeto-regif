import { StrictMode } from "react";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  // Futuro: AuthProvider, QueryClientProvider, ThemeProvider, etc.
  return <StrictMode>{children}</StrictMode>;
}
