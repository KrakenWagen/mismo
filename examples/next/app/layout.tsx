import type { ReactNode } from "react";

// This app's root layout: Next.js needs one, and it is the app's own, not a shared route's.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
