type PageTitleBandProps = {
  title: string;
  description?: string;
  className?: string;
};

export default function PageTitleBand({ title, description, className }: PageTitleBandProps) {
  return (
    <div className={className}>
      <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
      {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
    </div>
  );
}
