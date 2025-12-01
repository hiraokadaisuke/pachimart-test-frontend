import type { ReactNode } from 'react';

type MainContainerVariant = 'default' | 'wide' | 'full';

export default function MainContainer({
  children,
  variant = 'default',
  fullWidth = false,
}: {
  children: ReactNode;
  variant?: MainContainerVariant;
  fullWidth?: boolean;
}) {
  if (fullWidth) {
    return <div className="w-full max-w-none px-4 py-6 md:py-8 lg:px-6 xl:px-8">{children}</div>;
  }

  const maxWidthClass = variant === 'wide' ? 'max-w-[1360px]' : 'max-w-[960px]';
  const containerClass =
    variant === 'full'
      ? 'w-full max-w-none mx-0 px-0 py-6 md:py-8'
      : `mx-auto w-full ${maxWidthClass} px-4 py-6 md:py-8`;

  return <div className={containerClass}>{children}</div>;
}
