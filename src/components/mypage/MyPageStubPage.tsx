import type { ReactNode } from "react";

export default function MyPageStubPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      {description ? <p className="text-sm text-neutral-800">{description}</p> : null}
      {children}
    </div>
  );
}
