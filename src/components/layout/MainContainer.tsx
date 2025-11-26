import type { ReactNode } from 'react';

type MainContainerVariant = 'default' | 'wide' | 'full';

export default function MainContainer({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: MainContainerVariant;
}) {
  const maxWidthClass = variant === 'wide' ? 'max-w-[1360px]' : 'max-w-[960px]';
  const containerClass =
    variant === 'full'
      ? 'w-full max-w-none mx-0 px-0 py-6 md:py-8'
      : `mx-auto w-full ${maxWidthClass} px-4 py-6 md:py-8`;

  return <div className={containerClass}>{children}</div>;
}
