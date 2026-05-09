"use client";

/**
 * Providers wrapper — wraps the whole app with SessionProvider.
 * This makes useSession() available in any client component.
 * Must be a client component (hence "use client" above).
 */

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
