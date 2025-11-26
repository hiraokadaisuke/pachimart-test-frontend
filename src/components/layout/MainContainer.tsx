import type { ReactNode } from 'react';

type MainContainerVariant = 'default' | 'wide';

export default function MainContainer({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: MainContainerVariant;
}) {
  const maxWidthClass = variant === 'wide' ? 'max-w-[1360px]' : 'max-w-[960px]';

  return <div className={`mx-auto w-full ${maxWidthClass} px-4 py-6 md:py-8`}>{children}</div>;
}
