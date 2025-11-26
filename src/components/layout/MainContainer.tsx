import type { ReactNode } from 'react';

export default function MainContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">{children}</div>;
}
